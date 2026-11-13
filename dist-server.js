// server.ts
import express from "express";
import http from "http";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// src/data/evacuationData.ts
function determineCategory(nama, identitas, patientStatus) {
  const combined = `${nama} ${identitas} ${patientStatus || ""}`.toLowerCase();
  if (combined.includes("a/n") || combined.includes("an. ") || combined.includes("anak ")) {
    return "ANAK";
  }
  if (combined.includes("i/s") || combined.includes("ny.") || combined.includes("i/d") || combined.includes("istri") || combined.includes("persit")) {
    return "PERSIT";
  }
  if (combined.includes("pppk") || combined.includes("pns") || combined.includes("honorer") || combined.includes("asn")) {
    return "PNS";
  }
  return "MILITER";
}
function determineStatus(ket, srt) {
  const note = `${ket || ""} ${srt || ""}`.toLowerCase();
  if (note.includes("batal") || note.includes("dibatalkan")) return "BATAL";
  if (note.includes("ralat") || note.includes("diralat")) return "RALAT";
  if (note.includes("draft") || note.includes("proses")) return "DALAM_PROSES";
  return "SELESAI";
}
var rawData = [
  { "no": 1, "srt": "B/01/EV/I/2026", "tgl": "13/01/2026", "nama": "Tn. Randi Wijaya", "jk": "L", "umur": "26 Thn", "identitas": "Pratu/31210589071099", "jabatan": "Taunitgakkumwal 3 Unit gakkumwal 1 Subdenpom", "kesatuan": "Pomdam XVII/Cenderawasih", "diag": "Fractur Maxialia Dextra et Zigomaticum Dextra, Hematoma Orbita Dextra, Hematoma Zigomatikum kanan", "asal": "Rumkitban 17.08.01 Timika", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 2, "srt": "B/02/EV/I/2026", "tgl": "13/01/2026", "nama": "Ny.Harmawati Tanawali", "jk": "P", "umur": "40 Thn", "identitas": "I/d.Pratu/31080239810686", "jabatan": "Tabok So Ton 3 RU 3 Kipan C", "kesatuan": "Denma Brigif 20/IJK/3 Kostrad", "diag": "Calculus Of Kidney and Ureter", "asal": "Rumkitban 17.08.01 Timika", "tujuan": "RS TK II 17.05.01 Marthen Indey", "moda": "Pesawat", "pendamping": "Pratu Asis Tofir (Suami)", "ket": "BEROBAT" },
  { "no": 3, "srt": "B/03/EV/I/2026", "tgl": "14/01/2026", "nama": "Tn.La Ode M. Hanip", "jk": "L", "umur": "20Thn", "identitas": "Prada / 1725104050062710", "jabatan": "Ta Yonif TP 860 Waropen", "kesatuan": "Yonif TP 860 Waropen", "diag": "Cruciate Ligament Injury and Tibia Plateau Fracture", "asal": "Rumkitban 17.08.01 Timika", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 4, "srt": "B/04/EV/I/2026", "tgl": "14/01/2026", "nama": "Tn.Hider Louisen", "jk": "L", "umur": "30Thn", "identitas": "Praka/ 31170046420795", "jabatan": "Petembak DMR", "kesatuan": "Satgas Yonif 113/JS", "diag": "Post Urs Dextra", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 5, "srt": "B/05/EV/I/2026", "tgl": "23/01/2026", "nama": "Tn. Yuwardi Putra", "jk": "L", "umur": "24Thn", "identitas": "Serda / 1522107010000030", "jabatan": "Dantimpur", "kesatuan": "Satgas Yonif 121/MK", "diag": "Fusi Digiti III-IV Manus(D)", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 6, "srt": "B/06/EV/I/2026", "tgl": "29/01/2026", "nama": "Tn. Inal Saifudin", "jk": "L", "umur": "40Thn", "identitas": "Serda / 31050819900485", "jabatan": "Ba Satgas", "kesatuan": "Satgas Yonif 511/DY", "diag": "SCC Lidah", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 7, "srt": "B/07/EV/II/2026", "tgl": "3/2/2026", "nama": "Tn. Gustia Tanding", "jk": "L", "umur": "25Thn", "identitas": "Pratu / 31201274890801", "jabatan": "Tabak SO 2RU 1 Ton 3 Kikav 1", "kesatuan": "Denkav-3/SC Dam XVII/Cenderawasih", "diag": "Ileus Obstruksi ec Adhesi Post Laparatomi Splenektomi", "asal": "Rumkitban 17.08.01 Timika", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Pratu Roki Padandi/31201274890801 (Tabak SO 2 RU AP 2 Tonkav 2 Kikav 1)", "ket": "BEROBAT" },
  { "no": 8, "srt": "B/08/EV/II/2026", "tgl": "9/2/2026", "nama": "An.M. Alfarizan", "jk": "L", "umur": "3Thn", "identitas": "a/d. Serda/ 31120624390790", "jabatan": "Ba Obring Unit Obat Tonkes Kima Yonif Tp 858/MSB", "kesatuan": "Yonif TP 858/MSB Biak", "diag": "Attention Deficit Hyperactivity Disorer", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Ny. Aisyah Puspa Dewi / PPK 199810142024212022 (Perawat Terampil RS.TK II 17.05.01 Marthen Indey)", "ket": "BEROBAT" },
  { "no": 9, "srt": "B/10/EV/II/2026", "tgl": "10/2/2026", "nama": "Fidelia Fransiska Kainakainamu, S. Sos", "jk": "P", "umur": "47Thn", "identitas": "Kapten Ckm (K) / 21990194780279", "jabatan": "Pejabat Pengadaan Rumkit TK. II 17.05.01 Marthen Indey", "kesatuan": "Kesdam XVII/Cenderawasih", "diag": "Retinal Detacement OD", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Kolonel Chk Franky Mambrasar, S.H.,MH/ 71990005790771 (Kaotmil IV-21 manokwari Babinkum TNI/Suami)", "ket": "SEMBUH/KEMBALI" },
  { "no": 10, "srt": "B/09/EV/II/2026", "tgl": "27/2/2026", "nama": "Tn. Timbul Rezeki Suhendra Manurung", "jk": "L", "umur": "22Thn", "identitas": "Prada / 1723107030017000", "jabatan": "Ta Kodim 0212/TS", "kesatuan": "Satgas Yonif 121/ Macan Kumbang", "diag": "OD Parese N.VI dan V SupSol intracranial DD/Lesi di Sinus Cavernosus DD/Lesi di Batang Otak, OD Papil edema ec Susp Peningkatan TIK DD/ Compressive Optic Neuropaty", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Praka Surya Aditya/ 31170798830598 (Ta Yanrad Pokko kipan C)", "ket": "BEROBAT" },
  { "no": 11, "srt": "B/11/EV/II/2026", "tgl": "27/2/2026", "nama": "Tn. Firmanda Ridoari", "jk": "L", "umur": "26Thn", "identitas": "Serda/ 21210184650200", "jabatan": "Dantimpur Satgas Yonif 643/WNS", "kesatuan": "Satgas Yonif 643/WNS", "diag": "Avascular Necrosis Hip Joint (D)", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Prada manda/ 1424104030023212 (Tabak DMR Kotis Satgas Pamtas Yonif 643/WNS)", "ket": "BEROBAT" },
  { "no": 12, "srt": "B/12/EV/II/2026", "tgl": "27/2/2026", "nama": "Tn. Karona Susilo", "jk": "L", "umur": "49Thn", "identitas": "Kolonel Inf/11990033830876", "jabatan": "Irutum Itdam XVII/Cenderawasih", "kesatuan": "Itdam XVII/Cenderawasih", "diag": "Fistula Perinal", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Ny.Dwi Ari Sussanti (I/d Kol.Karona Susilo S.I.P.,M.Han)", "ket": "BEROBAT" },
  { "no": 13, "srt": "B/13/EV/III/2026", "tgl": "4/3/2026", "nama": "Tn. M.Alvian D,Saputra, S.Tr. (Han)", "jk": "L", "umur": "23Thn", "identitas": "Letda Cpm/ 1125107020002875", "jabatan": "Paidiktipidmilum 2", "kesatuan": "Pomdam XVII/Cenderawasih", "diag": "Ikterik jaundic pro evaluaasi", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Letkol Cku Surono (Paku TK II Makodam XVII/Cenderawasih)", "ket": "BEROBAT" },
  { "no": 14, "srt": "B/14/EV/III/2026", "tgl": "4/3/2026", "nama": "Tn. Kamran Lumban Raja", "jk": "L", "umur": "41Thn", "identitas": "Koptu/3131050396910584", "jabatan": "Ta Kodim 1705/nabire Rem 173/PVB", "kesatuan": "Kodim 1705/Nabire Korem 173/PVB", "diag": "Dyspepsia (K30)", "asal": "Polkes 17.09.03 Nabire", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Tri Ratna Sari (I/d Koptu Kamrn Lumban Raja)", "ket": "BEROBAT" },
  { "no": 15, "srt": "B/15/EV/III/2026", "tgl": "5/3/2026", "nama": "Tn. Hamzah, S.H.,M.H", "jk": "L", "umur": "51Thn", "identitas": "Mayor Ckm/21960283730974", "jabatan": "Kasi Tuud RS TK II Marthen Indey", "kesatuan": "Kesdam XVII/Cenderawasih", "diag": "Stenosis (+) Radiculopaty", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RS TK II Pelamonia Makassar", "moda": "Pesawat", "pendamping": "_", "ket": "SEMBUH/KEMBALI" },
  { "no": 16, "srt": "B/16/EV/III/2026", "tgl": "13/3/2026", "nama": "Ny.Hasmawati Tanawali", "jk": "P", "umur": "42 Thn", "identitas": "I/d Serda/31080239810686", "jabatan": "Ba Korem 133/NW", "kesatuan": "Korem 133/NW Dam XIII/Merdeka", "diag": "Nephrolith Sinistra, DM Type 2", "asal": "Rumkitban 17.08.01 Timika", "tujuan": "RS TK II Wolter Mongosidi Manado", "moda": "Pesawat", "pendamping": "Serda Asis Tofir/31080239810686 (Ba Korem 133/NW/Suami)", "ket": "BEROBAT" },
  { "no": 17, "srt": "B/17/EV/III/2026", "tgl": "16/3/2026", "nama": "Tn. Marco Budi Gunawan", "jk": "L", "umur": "35Thn", "identitas": "Kapten Inf/1114005710391", "jabatan": "Wadanyonif TP 813/AWY", "kesatuan": "Yonif TP 813/AWY", "diag": "Kista Ginjal Kiri", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 18, "srt": "B/18/EV/IV/2026", "tgl": "6/4/2026", "nama": "Tn. Irsyad Nugroho", "jk": "L", "umur": "40Thn", "identitas": "Letda Inf/210601232706585", "jabatan": "Danton SLT Kiban Yonif TP815/WGT", "kesatuan": "Yonif TP 815/WGT", "diag": "Hipertiroid Toxicosis/Thyrotoxicosis Hyperthyroidsm", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 19, "srt": "B/19/EV/IV/2026", "tgl": "8/4/2026", "nama": "Tn. Sunardi", "jk": "L", "umur": "34Thn", "identitas": "Kopda/31110494741191", "jabatan": "Ta Denmadam XVII/Cenderawasih", "kesatuan": "Denmadam XVII/Cenderawasih", "diag": "Post Tendon Trasfer due to BPI (D)", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RS TK II Pelamonia Makassar", "moda": "Pesawat", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 20, "srt": "B/20/EV/IV/2026", "tgl": "8/4/2026", "nama": "Tn. Yasri", "jk": "L", "umur": "27Thn", "identitas": "Pratu/31201237690698", "jabatan": "Babinsa Kamp. Otto Demo Ramil 1709-03 Warbah", "kesatuan": "Kodim 1709/Yawa", "diag": "Dislocation Of Shoulder Joint", "asal": "Polkes 17.09.05 Serui", "tujuan": "RS TK II 17.05.01 Marthen Indey", "moda": "Kapal Laut", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 21, "srt": "B/21/EV/IV/2026", "tgl": "8/4/2026", "nama": "Tn. Hery Ade Kantari", "jk": "L", "umur": "37Thn", "identitas": "Kopda/31100282830389", "jabatan": "Ta Denzipur 12/OHH Dam XVII/Cenderawasih", "kesatuan": "Denzipur 12/OHH Dam XVII/Cenderawasih", "diag": "Acute myocardinal infaction", "asal": "Polkes 17.09.03 Nabire", "tujuan": "RSPAL dr.Ramelan Surabaya", "moda": "Pesawat", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 22, "srt": "B/22/EV/IV/2026", "tgl": "9/4/2026", "nama": "Tn. Moch Ladiqi", "jk": "L", "umur": "29Thn", "identitas": "Sertu/21180047440997", "jabatan": "Baminlog 2 Simabrig", "kesatuan": "Brigif 20/IJK/3 Kostrad", "diag": "Abdominal Pain Susp Kolik Ureter", "asal": "Rumkitban 17.08.01 Timika", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 23, "srt": "B/23/EV/IV/2026", "tgl": "9/4/2026", "nama": "Tn. Taslim Azis", "jk": "L", "umur": "29Thn", "identitas": "Serda/201180150780597", "jabatan": "Bamon Sumteg Ru Har Denma", "kesatuan": "Brigif 20/IJK/3 Kostrad", "diag": "Muscle Back Spasme dd HNP", "asal": "Rumkitban 17.08.01 Timika", "tujuan": "RS TK II 17.05.01 Marthen Indey", "moda": "Pesawat", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 24, "srt": "B/24/EV/IV/2026", "tgl": "9/4/2026", "nama": "Tn. Riksman Prabowo Kaitman", "jk": "L", "umur": "30Thn", "identitas": "Sertu/211702215720896", "jabatan": "Bajurad 2 Ton Komlap Kihu Denma", "kesatuan": "Brigif 20/IJK/3 Kostrad", "diag": "Flexion Contracture Genu Dextra Post Recontruksi ACL", "asal": "Rumkitban 17.08.01 Timika", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 25, "srt": "B/25/EV/IV/2026", "tgl": "13/04/2026", "nama": "Tn. Haruna", "jk": "L", "umur": "27Thn", "identitas": "Praka/31180808980499", "jabatan": "Ta Pam Situud Denhubdam Hubdam XVII/Cenderawasih", "kesatuan": "Komlekdam XVII/Cenderawasih", "diag": "ACL Tear Knee (D)", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 26, "srt": "B/26/EV/IV/2026", "tgl": "14/04/2026", "nama": "Tn. Jekson Siagian", "jk": "L", "umur": "42Thn", "identitas": "Letda Cke/21060205510784", "jabatan": "Dantimhub 1 Subdenhub 2 Denhubrem 172 Hubdam XVII/Cenderawasih", "kesatuan": "Komlekdam XVII/Cenderawasih", "diag": "CAD, CTO RCA", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 27, "srt": "B/27/EV/IV/2026", "tgl": "14/04/2026", "nama": "Tn. Khoirudin", "jk": "L", "umur": "31Thn", "identitas": "Serda/31130770630594", "jabatan": "Bintara Brigif TP 80/Kurare", "kesatuan": "Brigif TP 80/Kurare", "diag": "Disc Disoder dengan Radiculopathy, Spinal Instability", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "_", "ket": "BEROBAT" },
  { "no": 28, "srt": "B/28/EV/IV/2026", "tgl": "19/04/2026", "nama": "An.Nizam Alfarizki", "jk": "L", "umur": "4Thn", "identitas": "a/d.Serda /21150185540494", "jabatan": "Baur Perslog Situud Jasdam XVII/Cenderawasih", "kesatuan": "Jasdam XVII/Cenderawasih", "diag": "ODS Hereditary Retinal Distrrophy", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Ny.Sulis Tiana,S.E (i/d Serka Azlan/21150185540394)", "ket": "BEROBAT" },
  { "no": 29, "srt": "B/29/EV/IV/2026", "tgl": "24/04/2026", "nama": "An.Muhammad Bilal Atthariz", "jk": "L", "umur": "4Thn", "identitas": "a/d. Serka/ 21150058661295", "jabatan": "Batiwatpers Urpers Situud Hubdam XVII/Cenderawasih", "kesatuan": "Komlekdam XVII/Cenderawasih", "diag": "Suspect Autistic Disoderr dd/ASD, Social Communication Disoder", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Serka Desta Ristiani/21150058661295 (Batiwatpers Urpers Situud Hubdam XVII/Cenderawasih/ Ayah)", "ket": "BEROBAT" },
  { "no": 30, "srt": "B/30/EV/IV/2026", "tgl": "24/04/2026", "nama": "Tn. M. Dimas Suryadi", "jk": "L", "umur": "22Thn", "identitas": "Serda/ 15251040016564", "jabatan": "Bajur DF Tonpernita Kinub", "kesatuan": "Brigif TP 80/Kurare", "diag": "Nyeri lutut traksi pasca due to trauma ACL & Meniscus Injury", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Lettu Ckm dr.Komang Budi Sastra/1255111990002359 (Pasikes Sima Brigif TP 80/Kurare", "ket": "BEROBAT" },
  { "no": 31, "srt": "B/31/EV/IV/2026", "tgl": "24/04/2026", "nama": "Ny.Euis Ati Rohaeni", "jk": "P", "umur": "44Thn", "identitas": "I/d. Letkol/ 11010001620871", "jabatan": "Kasetumdam XVII/Cenderawasih", "kesatuan": "Setumdam XVII/Cenderawasih", "diag": "Multipel Sclerosis (MS)", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Letkol Andri Risnawan/ 11010001620871(Kasetumdam XVII/Cenderawasih/Suami)", "ket": "BEROBAT" },
  { "no": 32, "srt": "B/32/EV/IV/2026", "tgl": "28/04/2026", "nama": "Tn. Bagus Dwi hartanto", "jk": "L", "umur": "35 Thn", "identitas": "Mayor inf/11130011250391", "jabatan": "Wadanyonif TP 814/JZA", "kesatuan": "Yonif TP 814/JZA", "diag": "Rotator cuff tear sindrome shoulder (D)", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 33, "srt": "B/33/EV/V/2026\nBATAL EVAK", "tgl": "12/5/2026", "nama": "Tn. Rasmin Kasim", "jk": "L", "umur": "23 Thn", "identitas": "Prada/172511030044467", "jabatan": "Tabanalkes Ton Kesban Kimedis Keslap", "kesatuan": "Yonif TP 820/DAAI", "diag": "Haemoptoe masive Ec.TB Paru Kasus Baru,MTB (-),HIV(-)", "asal": "Rumkitban 17.08.01 Timika", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Serda Rifqy Reydhiansyah/ 1725111030044467 (Bintara Penyaring Ton Patob/Kimedis/Keslap/Yonif TP 820/DAAI)", "ket": "SEMBUH/KEMBALI" },
  { "no": 34, "srt": "B/34/EV/V/2026", "tgl": "12/5/2026", "nama": "Tn. Aries Narisman Putra", "jk": "L", "umur": "36 Thn", "identitas": "PPPK Gol V/ 198905312025211057", "jabatan": "Turmin Urlat Urdal Situud Kesdam XVII/Cenderawasih", "kesatuan": "Kesdam XVII/Cenderawasih", "diag": "Cholelithiasis", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAL dr.Ramelan Surabaya", "moda": "Pesawat", "pendamping": "-", "ket": "SEMBUH/KEMBALI" },
  { "no": 35, "srt": "B/35/EV/V/2026", "tgl": "20/05/2026", "nama": "An.M. Alhariz Ardiansyah", "jk": "L", "umur": "18Thn", "identitas": "a/d. Sertu/31030371135068", "jabatan": "Babinsa Kodim 1705 Nabire", "kesatuan": "Kodim 1705 Nabire", "diag": "Moderate Depressive Episode", "asal": "Polkes 17.09.03 Nabire", "tujuan": "RS TK II Pelamonia Makassar", "moda": "Pesawat", "pendamping": "Setu Fauji (Ayah)/31030371135068 Babinsa Kodim 1705 Nabire & ny.Masita Mashud (Ibu/Istri)", "ket": "BEROBAT" },
  { "no": 36, "srt": "B/36/EV/V/2026", "tgl": "25/05/2026", "nama": "Tn. Hamzah, S.H.,M.H", "jk": "L", "umur": "51 Thn", "identitas": "Mayor Ckm/21960283730974", "jabatan": "Kasi Tuud RS TK II Marthen Indey", "kesatuan": "Kesdam XVII/Cenderawasih", "diag": "Radiculopaty Spinal", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RS TK II Pelamonia Makassar", "moda": "Pesawat", "pendamping": "-", "ket": "SEMBUH/KEMBALI" },
  { "no": 37, "srt": "B/37/EV/V/2026", "tgl": "25/05/2026", "nama": "Tn. Pasiar Merel", "jk": "L", "umur": "31 Thn", "identitas": "Praka/31170397700895", "jabatan": "Dapokpan-1/Ta Sniper 1 Ru 2 Ton II Kipan A Yonif 754/ENK/20/3/Kostrad", "kesatuan": "Yonif 754/ENK", "diag": "Post Fusi (+) Decompres", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 38, "srt": "B/38/EV/V/2026", "tgl": "29/05/2026", "nama": "Ny. Maria Rahmatillah Gobel", "jk": "P", "umur": "40 Thn", "identitas": "i/d Sertu/31071487890485", "jabatan": "Babinsa Koramil Web.Kodim 1701 Jayapura", "kesatuan": "Kodim 1701 Jayapura", "diag": "G4P2A1 Gravida 31WGT Tunggal Hidup, letak Sungsang + Omphalocele+Placenta Previa Total Tanpa Akre + Bekas SC 2x", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Sertu Martinus/31071487890485 (Babinsa Kodim 1701 Jayapura)", "ket": "BEROBAT" },
  { "no": 39, "srt": "B/39/EV/VI/2026", "tgl": "4/ 06/2026", "nama": "Tn. Purnomo Heru Sutarto, S.H.,MSc", "jk": "L", "umur": "53 Thn", "identitas": "Kolonel Chk/11990011140273", "jabatan": "Kakumdam XVII/Cenderawasih", "kesatuan": "Kumdam XVII/Cenderawasih", "diag": "Tonsilitis Kronik", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 40, "srt": "B/40/EV/VI/2026", "tgl": "4/ 06/2026", "nama": "Ny. Siti Amaliah", "jk": "P", "umur": "55Thn", "identitas": "I/d Mayor/ 21960020550574", "jabatan": "Kepala Departemen Teritorial", "kesatuan": "Rindam XVII/Cenderawasih", "diag": "Sequele Stroke Infark + DM T2 + HT Terkontrol + Dislipidemia + Hiperuricemia", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Mayor Inf Edi Erwanto/21960020550574 (Kepala Departemen Teritorial Rindam XVII/Cenderawasih)", "ket": "BEROBAT" },
  { "no": 41, "srt": "B/41/EV/VI/2026", "tgl": "10/ 06/2026", "nama": "Tn. Hasanudin", "jk": "L", "umur": "36Thn", "identitas": "Letda Inf/21100233281190", "jabatan": "W.S Pasipers ", "kesatuan": "Yonif TP 804/DBAY", "diag": "Fistula Perianal", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 42, "srt": "B/42/EV/VI/2026", "tgl": "12/ 06/2026", "nama": "Tn. Dodi Susanto", "jk": "L", "umur": "24Thn", "identitas": "Pratu/1722105020013160", "jabatan": "Ta Mu Pokkoton Tonpan III Kipan C Yonif 751/VJS Dam XVII/Cenderawasih", "kesatuan": "Satgas Yonif 751/VJS", "diag": "Crash Injury dengan Rupture Artery", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Kapten Ckm dr. Lisan Gigih Prakoso/1221112940000267/ Dokter Satgas Yonif 751/VJS", "ket": "BEROBAT" },
  { "no": 43, "srt": "B/43/EV/VI/2026", "tgl": "18/06/2026", "nama": "Tn. Dedi Priyono", "jk": "L", "umur": "47Thn", "identitas": "Mayor Ckm/21000052440679", "jabatan": "SF Radiografer Gol IV", "kesatuan": "Kesdam XVII/Cenderawasih", "diag": "Hemoroid Interna Grade IV", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "SEMBUH/KEMBALI" },
  { "no": 44, "srt": "B/44/EV/VI/2026", "tgl": "22/06/2026", "nama": "Tn. Yulianus Adrianto Erari", "jk": "L", "umur": "23Thn", "identitas": "Sertu/21210295040802", "jabatan": "Danru 1 Ton SMS/Kiban", "kesatuan": "Yonif 753/AVT", "diag": "Corpus Alienum Proyektil", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Pratu Inozenci Irvian Nobos/1722109000013053 /Ta Tandu Keslap 2 Pojurkes 1 Ton Kes Kima Yonif 753/AVT", "ket": "BEROBAT" },
  { "no": 45, "srt": "B/45/EV/VI/2026", "tgl": "24/06/2026", "nama": "An.Faizan Nur Yusuf Samujiyo", "jk": "L", "umur": "14Thn", "identitas": "a/d. Kolonel ARH/ 11990053961277", "jabatan": "Aslog Kasdam XVII/Cenderawasih", "kesatuan": "Slogdam XVII/Cenderawasih", "diag": "Impaksi Gigi 23 (Impaks Kaninus Maksila Sinistra)", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Kolonel ARH.Samujiyo / 1199005361277", "ket": "BEROBAT" },
  { "no": 46, "srt": "B/46/EV/VI/2026", "tgl": "25/06/2026", "nama": "Tn. Yan Hendrik Sairei Rumbiak", "jk": "L", "umur": "26Thn", "identitas": "Pratu/31210542110899", "jabatan": "Tabak So Kipan Yonif 511/DY", "kesatuan": "Satgas Yonif 511/DY", "diag": "Penurunan Kesadaran ec.Sol Infeksi (Toksoplasmosis Cerebri),Edema Vasogenik, Afiasia Motorik,Hemiparesis Flaksid Dekstra", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Serda Ricki Damar Sasongko/31081874550387,Bakes 511/DY", "ket": "BEROBAT" },
  { "no": 47, "srt": "B/47/EV/VI/2026", "tgl": "25/06/2026", "nama": "Tn. Darmansyah", "jk": "L", "umur": "30Thn", "identitas": "Kapten Inf/11200001360795", "jabatan": "Pasi Pers", "kesatuan": "Yonif 753/AVT", "diag": "Fistula Perinal", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Ny.Andriani Prawibowo/i.d Kapten Inf.Darmansyah", "ket": "BEROBAT" },
  { "no": 48, "srt": "B/48/EV/VI/2026", "tgl": "29/06/2026", "nama": "Tn. Erwin Kurnia", "jk": "L", "umur": "35Thn", "identitas": "Kopda/31110090840391", "jabatan": "Wadantimpur", "kesatuan": "Satgas Yonif 407/PK", "diag": "Struma Nodusa Susp Keganasan (Tiroid S)", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 49, "srt": "B/49/EV/VI/2026", "tgl": "29/06/2026", "nama": "Tn. Imam Suhadi D.D, S.K.M", "jk": "L", "umur": "50Thn", "identitas": "Mayor Ckm/21980654211275", "jabatan": "SF Paramedis Fungsional Gol.V/mayor Instaljangdiag Rumah Sakit TK.II 17.05.01 Marthen Indey", "kesatuan": "Kesdam XVII/Cenderawasih", "diag": "ACL Ligament Injury", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "SEMBUH/KEMBALI" },
  { "no": 50, "srt": "B/50/EV/VI/2026", "tgl": "29/06/2026", "nama": "Tn.Adil", "jk": "L", "umur": "24Thn", "identitas": "Serda/1525112020015636", "jabatan": "Bajuyar Simayon Kima", "kesatuan": "Yonif TP 820/DAAI", "diag": "- Vertigo dt Susp VBI dd Post malaria Neurogical Syndrome, Probable Meniere Desiase", "asal": "Rumkitban 17.08.01 Timika", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Serda Muhammad Akbar Habibi Sitorus /152510203060011134/Bawat Bedah Unit Lap Tonkes Kima Yonif TP 820/DAAI", "ket": "BEROBAT" },
  { "no": 51, "srt": "B/51/EV/VII/2026", "tgl": "3/7/2026", "nama": "Tn.Kostan Helkia A", "jk": "L", "umur": "49 Tahun", "identitas": "Koptu/31980310270377", "jabatan": "Babinsa Ramil 1701-2", "kesatuan": "Kodim 1701/Jayapura", "diag": "PCV, HIV", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Ny. Robeka Yohana Pattipeme/Istri dari Koptu Konstan Helkia Asyerem", "ket": "BEROBAT" },
  { "no": 52, "srt": "B/52/EV/VII/2026", "tgl": "17/7/2026", "nama": "Ny.Olha Sara", "jk": "P", "umur": "43 Tahun", "identitas": "I/d Lettu Inf Stevanus/ 31980303340476", "jabatan": "Pasi Log Kodim 1705/NBR", "kesatuan": "Kodim 1705/Nabire", "diag": "M54,5-Low Back Pain", "asal": "Polkes 17.09.03 Nabire", "tujuan": "RS TK II Pelamonia Makassar", "moda": "Pesawat", "pendamping": "Lettu Inf Stevanus/31980303340476/Pasi Log Kodim 1705 NBR/Suami", "ket": "BEROBAT" },
  { "no": 53, "srt": "B/53/EV/VII/2026", "tgl": "17/7/2026", "nama": "Tn.Trii Anggoro R", "jk": "L", "umur": "41 Tahun", "identitas": "Serda/31071190530385", "jabatan": "Baur Data Ramil 06 Siriwo", "kesatuan": "Kodim 1705/Nabire", "diag": "R00.0-Tachycardia,Unspecified", "asal": "Polkes 17.09.03 Nabire", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Ny. Anastasia F Djamil Go dan Kenzie Ravindra P Djamil Go/ istri dan Anak dari Serda Tri Angoro Putro", "ket": "BEROBAT" },
  { "no": 54, "srt": "B/54/EV/VII/2026", "tgl": "27/7/2026", "nama": "Ny.Riska Aditiya", "jk": "P", "umur": "29 Tahun", "identitas": "I/d Letda Cpm Agus Widoyono/ 21070437921086", "jabatan": "Dansubdenpom XVII/D Sarmi", "kesatuan": "Pomdam XVII/Cenderawasih", "diag": "Fr Maxilla (Lefort II)", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Letda Cpm Agus Widoyono/1070437921086/Dansubdenpom XVII/D Sarmi/ Suami dari Ny. Riska Aditiya", "ket": "BEROBAT" },
  { "no": 55, "srt": "B/55/EV/VII/2026", "tgl": "29/7/2026", "nama": "Tn. Alfian Noufal Hela Milenio", "jk": "L", "umur": "26 Tahun", "identitas": "Letda inf/1226101000003570", "jabatan": "Danton Pokkoton Ton Ruminansia Ki Peternakan", "kesatuan": "Yonif TP 859/RBK", "diag": "Spondylolisthesis", "asal": "Polkes 17.09.03 Biak", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 56, "srt": "B/56/EV/VIII/2026", "tgl": "31/7/2026", "nama": "Fidelia Fransiska K. S.Sos", "jk": "P", "umur": "47 Tahun", "identitas": "Kapten Ckm (K) / 21990194780279", "jabatan": "Pejabat Pengadaan Rumkit TK. II 17.05.01 Marthen Indey", "kesatuan": "Kesdam XVII/Cenderawasih", "diag": "Post Silicon oil ec.retinal detachment+pseudfakia OD Katarak immature OS", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "SEMBUH/KEMBALI" },
  { "no": 57, "srt": "B/56/EV/VIII/2026", "tgl": "5/8/2026", "nama": "An. Mochamad Aidam", "jk": "L", "umur": "3Tahun 4 Bulan", "identitas": "a/d. Pelda/21060156190984", "jabatan": "Batiminseldik Ajendam XVII/Cenderawasih", "kesatuan": "Ajendam XVII/Cenderawasih", "diag": "Udecensus Testis (S)", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RS TK II Pelamonia Makassar", "moda": "Pesawat", "pendamping": "Pelda Mochamad Nurhuda/21060156190984/Ayah dari An.Mochamad Aidam", "ket": "BEROBAT" },
  { "no": 58, "srt": "B/57/EV/VIII/2026", "tgl": "5/8/2026", "nama": "Tn. Ricardo De Yesus Monteiro", "jk": "L", "umur": "21 Tahun", "identitas": "Serda / 1524104050006553", "jabatan": "Ba Tukang Kayu dan Batu Denzibang 1/Jayapur-Zidam", "kesatuan": "Zidam XVII/Cenderawasih", "diag": "Fr Maxilla Fascialis Post ORIF", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 59, "srt": "B/58/EV/VIII/2026", "tgl": "5/8/2026", "nama": "Tn.Sukamdi, S.I.P", "jk": "L", "umur": "58 Tahun", "identitas": "Brigjen TNI / 1910050080868", "jabatan": "Kapoksahli Pangdam XVII/Cenderawasih", "kesatuan": "Kodam XVII/CEnderawasih", "diag": "TIA (PRO MRI Kepala), ABCD Score 1", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "SEMBUH/KEMBALI" },
  { "no": 60, "srt": "B/59/EV/VIII/2026", "tgl": "5/8/2026", "nama": "Tn. Muhammad Rohim", "jk": "L", "umur": "24 Tahun", "identitas": "Pratu/1722102020010804", "jabatan": "Takes TIM1/II/MA Kout", "kesatuan": "Satgas Yonif 645/GTY", "diag": "Sindrom Nefrotik dd Nefritik", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 61, "srt": "B/60/EV/VIII/2026", "tgl": "7/8/2026", "nama": "Tn. Joni Ariska", "jk": "L", "umur": "30 Tahun", "identitas": "Praka/31160237340496", "jabatan": "Taban Produksi - 2 Ru Padi & Palawija Ki Pertanian Yonif TP 810/BEM Brigif TP 80/Kurare Kodam XVII/Cenderawasih", "kesatuan": "Yonif TP 810/BEM", "diag": "PVC", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RS TK II Pelamonia Makassar", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 62, "srt": "B/61/EV/VIII/2026", "tgl": "20/8/2026", "nama": "Tn. Nur Amal Jaya", "jk": "L", "umur": "22 Tahun", "identitas": "Prada/1726105040087991", "jabatan": "TabakPan 1 Yonif TP 910/AFY", "kesatuan": "Yonif TP 910/AFY", "diag": "Disc Disorder dengan Radiculopaty", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Serda A Muh Fathir/1526111050029983/Baminpers Simayon Kima/Yonif TP 910/AFY", "ket": "BEROBAT" },
  { "no": 63, "srt": "B/62/EV/VIII/2026\nRALAT SRT KRN PX SUDAH PINDAH SATUAN BARU", "tgl": "20/8/2026", "nama": "Tn. Nur Arifin", "jk": "L", "umur": "31 Tahun", "identitas": "Kapten Czi/11190030421094", "jabatan": "Pama Zidam XVII/Cenderawasih", "kesatuan": "Zidam XVII/Cenderawasih", "diag": "Schwannoma Regio Cubiti Dextra", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 64, "srt": "B/63/EV/VIII/2026", "tgl": "20/8/2026", "nama": "Tn. Berlin Bronson Sitindaon, S.Sos.,M.Si.", "jk": "L", "umur": "46 Tahun", "identitas": "Kolonel Inf/11010045781179", "jabatan": "Kabagdik Rindam XVII/Cenderawasih", "kesatuan": "Rindam XVII/Cenderawasih", "diag": "Abses Perianal", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Ny. Joy's Hary Andja/42tahun/istri dari Tn.berlin Bronson Sitindaon, S,Sos.,M.Si", "ket": "BEROBAT" },
  { "no": 65, "srt": "B/64/EV/VIII/2026", "tgl": "24/8/2026", "nama": "Tn. Chairul Suaeri", "jk": "L", "umur": "25 Tahun", "identitas": "Sertu/21210424400702", "jabatan": "Provost Kodim 1702 Jayawijaya Wamena", "kesatuan": "Kodim 1702 Jayawijaya", "diag": "LBP due to radiculopathy, Lumbal dd HNP", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 66, "srt": "B/65/EV/VIII/2026", "tgl": "27/8/2026", "nama": "Fini Rahmawati, S.Kep.,Ns", "jk": "P", "umur": "32 Tahun", "identitas": "PPPK Gol X/199408282024212025", "jabatan": "Perawat Ahli Pertama RSMI", "kesatuan": "Kesdam XVII/Cenderawasih", "diag": "Tuba Dextra Non Paten, Hidrosalping, Lesi Pra Kanker Serviks", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Serma Adi Kurnia Jaya/21110221130991/ Suami Ny.Fini/Batiprot Watpers Spersdam XVII/Cen", "ket": "BEROBAT" },
  { "no": 67, "srt": "B/66/EV/VIII/2026", "tgl": "31/8/2026", "nama": "Tn. Anang Supardi", "jk": "L", "umur": "52Tahun", "identitas": "Kapten Inf/390740510870", "jabatan": "Danramil Membramo Hulu Dapra", "kesatuan": "Kodim 1712/Sarmi", "diag": "Afakia OD+Katarak Imatur OS, Hipermetropia OD", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Ny.Nurlaely Hutabarat/Istri dari Tn.Anang Supardi", "ket": "BEROBAT" },
  { "no": 68, "srt": "B/67/EV/IX/2026", "tgl": "2/9/2026", "nama": "Tn. Sulaeman", "jk": "L", "umur": "47 Tahun", "identitas": "Lettu Cpm/21980280740877", "jabatan": "Kastaltahmil Pomdam XVII/Cenderawasih", "kesatuan": "Pomdam XVII/Cenderawasih", "diag": "Meniscus Tear Knee (S)", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 69, "srt": "B/68/EV/IX/2026", "tgl": "3/9/2026", "nama": "Tn. Nur Arifin", "jk": "L", "umur": "31 Tahun", "identitas": "Kapten Czi/11190030421094", "jabatan": "Pama Yonif TP 814/JZA", "kesatuan": "Yonif TP 814/JZA", "diag": "Schwannoma Regio Cubiti Dextra", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Prada Miftahul Khair/Taban produksi 1 RU 1 Unggas Ton Unggas Ki Peternakan", "ket": "BEROBAT" },
  { "no": 70, "srt": "B/69/EV/IX/2026", "tgl": "7/9/2026", "nama": "Tn. Hadi Purnomo", "jk": "L", "umur": "42 Tahun", "identitas": "Pelda/21050233091184", "jabatan": "Turwatum Unit Watnap Rumkitban  17.08.01 Timika Denkesyah 17.04.02 Nabire", "kesatuan": "Kesdam XVII/Cenderawasih", "diag": "LBP dt. Sisp HNP Lumbalis dd Susp Spinal Canal Stenois Dengan Paralumbal Muscle Spasme HT st II", "asal": "Rumkitban 17.08.01 Timika", "tujuan": "RS. TK II dr. Soepraoen Malang", "moda": "Pesawat", "pendamping": "Ny. Yayuk/Istri dari Tn. Hadi Purnomo", "ket": "BEROBAT" },
  { "no": 71, "srt": "B/70/EV/X/2026", "tgl": "1/10/2026", "nama": "Tn. Oktaf Silas Burumi", "jk": "L", "umur": "28 Tahun", "identitas": "Pratu /3118039070698", "jabatan": "Ta Kodim 1715/Yahukimo", "kesatuan": "kodim 1715/Yahukimo", "diag": "ACL Injury (S)", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Ny.Sella Cat Arina Awak/Istri dari Tn.Oktaf SIlas Burumu", "ket": "BEROBAT" },
  { "no": 72, "srt": "B/71/EV/X/2026", "tgl": "1/10/2026", "nama": "Tn. Restu Luberna", "jk": "L", "umur": "52Tahun", "identitas": "Kapten Inf/21950055390574", "jabatan": "Pama Kodim 1715/Yahukimo", "kesatuan": "kodim 1715/Yahukimo", "diag": "STT Regio Infra Auricular (S)", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAL dr.Ramelan Surabaya", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 73, "srt": "B/72/EV/X/2026", "tgl": "5/10/2026", "nama": "Tn. Franky S.H Situmorang", "jk": "L", "umur": "46 Tahun", "identitas": "Mayor Inf/11020037850980", "jabatan": "Kasi Analis Sansidam XVII/Cen", "kesatuan": "Sansidam XVII/Cen", "diag": "Pneumothorax berulang", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Tn.Emanuel Rumangun,S.Kep/pNS III.C/197212201998031010/ Perawat turwatum bangsal Rumah Sakit Tk.II Marthen Indey", "ket": "BEROBAT" },
  { "no": 74, "srt": "B/73/EV/X/2026", "tgl": "8/10/2026", "nama": "Tn. M. Ikhsandi Rustam", "jk": "L", "umur": "22 Tahun", "identitas": "Serda/1525111060018702", "jabatan": "Ba Yonif TP 858/MSB", "kesatuan": "Yonif TP 858/MSB", "diag": "Trigeminal Neuralgia Sekunder", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Serda Ramayudha Sarwanto/1525111060018702/Ba Pengobatan Berat Ton Patob Kimedis/Keslap Yonif TP 858/MSB", "ket": "BEROBAT" },
  { "no": 75, "srt": "B/74/EV/2026", "tgl": "12/10/2026", "nama": "Nn. Melania", "jk": "P", "umur": "41 Tahun", "identitas": "PPPK Gol IX/1985042126212054", "jabatan": "ASN RS TK II !7.05.01 Marthen Indey", "kesatuan": "Kesdam XVII/Cenderawasih", "diag": "CHF ec HHD.IHD, DM Tipe 2, Dyslipidemia, Selulitis", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 76, "srt": "B/75/EV/2026", "tgl": "12/10/2026", "nama": "Tn. Rian Aq Edysetiaan Kiri", "jk": "L", "umur": "29 tahun", "identitas": "Pratu/31190383820297", "jabatan": "Tabak SPG Tim 1 Pos Bolakme Satgas Yonif 645/GTY", "kesatuan": "Satgas Yonif 645/GTY", "diag": "Tumor Paru Dextra", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 77, "srt": "B/76/EV/2026", "tgl": "16/10/2026", "nama": "Tn. Iwank Andrea Septana", "jk": "L", "umur": "20 Tahun", "identitas": "Serda/3526112050566459", "jabatan": "Ba Elektronika Subur Ops Bra Ops.Kom Senkom Lanud SPR", "kesatuan": "Lanud Silas Papare", "diag": "FR. Mandibula Segmental", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSAU dr. Esnawan Antariksa Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 78, "srt": "B/77/EV/2026", "tgl": "16/10/2026", "nama": "Tn. Bayu Aji Widiatmoko, S.Tr.Han", "jk": "L", "umur": "28 Tahun", "identitas": "Kapten Czi/112000217730598", "jabatan": "Danki Zipur 10/KYD", "kesatuan": "Zipur 10/KYD", "diag": "ACL Tear Knee (D) + Members", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 79, "srt": "B/78/EV/2026", "tgl": "19/10/26", "nama": "Tn. M Ivan Fadilah", "jk": "L", "umur": "22 Tahun", "identitas": "Serda/1525106040017092", "jabatan": "Danru 1 Ton II Kipan A", "kesatuan": "Yonif TP 816/DRK", "diag": "Ligament Knee Injury, Quadricep Tendonruptur, Muscle Atrophy", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 80, "srt": "B/79/EV/2026", "tgl": "19/10/26", "nama": "Ny. Novita Nigsih", "jk": "P", "umur": "46 Tahun", "identitas": "I/d Kolonel Inf/11010044611079", "jabatan": "Asops Kasdam XVII/Cenderawasih", "kesatuan": "Kodam XVII/CEnderawasih", "diag": "Impaksi Gigi", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Kolonel Inf Andri Hadiyanto, M.Han/11010044611079/Asops Kasdam XVII/Cen/Suami", "ket": "BEROBAT" },
  { "no": 81, "srt": "B/80/EV/2026", "tgl": "23/10/26", "nama": "Ny. Yanti Setiawati", "jk": "P", "umur": "50 Tahun", "identitas": "I/d Brigjen TNI/1910050080868", "jabatan": "Kapoksahli Pangdam XVII/Cenderawasih", "kesatuan": "Kodam XVII/CEnderawasih", "diag": "TIA", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Brigjen TNI Sukamdi, S.I.P./1910050080868/Kapoksahli Pangdam XVII/Cen/Suami", "ket": "BEROBAT" },
  { "no": 82, "srt": "B/81/EV/2026", "tgl": "29/10/26", "nama": "Tn. Windy Putra Pratama", "jk": "L", "umur": "26 Tahun", "identitas": "Pratu/62010003551081", "jabatan": "Ta Bakpan 5 R1 T1 Ki B 463 Pasgat", "kesatuan": "Satgas Brigade Parako 463 Pasgat", "diag": "Post Orif Humerus (D) +, Radical Nerve Injuri", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Mayor Kes dr. Adi Irawan/539533/Sesrumkit RSAU dr SUkirman Lanud Roesmin Nurjain/ Satgas Brigade parako 463 Pasgat", "ket": "BEROBAT" },
  { "no": 83, "srt": "B/82/EV/2026", "tgl": "2/11/2026", "nama": "Tn.Agus Rudijanto", "jk": "L", "umur": "52 Tahun", "identitas": "PNS Gol III A/ 97408151998031001", "jabatan": "Ur Tuud Administrasi Perkantoran", "kesatuan": "Kodaeral X Jayapura", "diag": "Low back pain ec canal stenosis", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAL dr.Ramelan Surabaya", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 84, "srt": "Srt Evak RS.DUSTIRA", "tgl": "3/11/2026", "nama": "Tn.Gilberth Sawaki", "jk": "L", "umur": "27 Tahun", "identitas": "Serda", "jabatan": "SISWA PUSDIKJAS", "kesatuan": "Jasdam XVII/Cenderawasih", "diag": "ACL MENISCUS REPAIR", "asal": "RS TK II DUSTIRA BANDUNG", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Kereta Api", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 85, "srt": "B/83/EV/2026", "tgl": "4/11/2026", "nama": "Tn. Nasser Khaled", "jk": "L", "umur": "40 Tahun", "identitas": "Letkol Inf/ 11080110480986", "jabatan": "Daninteldam XVII/Cenderawasih", "kesatuan": "Inteldam XVII/Cenderawasih", "diag": "Nyeri Lutut & Tidan Strain", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 86, "srt": "B/84/EV/2026", "tgl": "4/11/2026", "nama": "Tn. Bayu Setya Yogasara, S,Hunt.Int", "jk": "L", "umur": "40 Tahun", "identitas": "Letkol Inf/ 1108010711285", "jabatan": "Danyonif TP 814/JZA", "kesatuan": "Yonif TP 814/JZA", "diag": "Menicus Injury", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "-", "ket": "BEROBAT" },
  { "no": 87, "srt": "B/85/EV/2026", "tgl": "6/11/2026", "nama": "Tn. Umar, A.Md.Kes", "jk": "L", "umur": "45 Tahun", "identitas": "PNS Gol III B/198107092002121006", "jabatan": "Penata Labkes Instaljangdiag Rumkit Tk.II 17.05.01 Marthen Indey", "kesatuan": "Kesdam XVII/Cenderawasih", "diag": "Ca. nasofaring + Susp.Metastase hepar", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RS Universitas Hasanuddin Makasar", "moda": "Pesawat", "pendamping": "Ny. Ria Restiyanti Hasanuddin/Istri dari Tn. Umar, A.Md.Kes", "ket": "BEROBAT" },
  { "no": 88, "srt": "B/86/EV/2026", "tgl": "6/11/2026", "nama": "Tn. Sarwono", "jk": "L", "umur": "48 Tahun", "identitas": "Mayor Cba/2199002241178", "jabatan": "Kasi Yaga Bekangdam XVII/Cenderawasih", "kesatuan": "Bekangdam XVII/Cenderawasih", "diag": "Fraktur costae 5 & 6 Lateral sinistra", "asal": "RS TK II 17.05.01 Marthen Indey", "tujuan": "RSPAD Gatot Soebroto Jakarta", "moda": "Pesawat", "pendamping": "Serda Benediktus L.Keray/1522101000001707/ Staf Siada Bekangdam XVII/Cenderawasih", "ket": "BEROBAT" }
];
function isRecordSembuh(r) {
  if (!r) return false;
  if (r.isSembuh === true) return true;
  if (r.isSembuh === false && r.lastEditedAt) return false;
  const text = `${r.ket || ""} ${r.srt || ""} ${r.catatanSembuh || ""}`.toLowerCase();
  return text.includes("sembuh") || text.includes("kembali ke satuan") || text.includes("kembali ke kesatuan") || text.includes("kembali satuan") || text.includes("pulang ke satuan") || text.includes("selesai rawat") || text.includes("selesai berobat");
}
var initialEvacuationData = rawData.map((item) => {
  const isRecovered = isRecordSembuh(item);
  return {
    ...item,
    id: `rec-${item.no}-${item.srt}`,
    kategori: determineCategory(item.nama, item.identitas, item.patientStatus),
    status: determineStatus(item.ket, item.srt),
    isSembuh: isRecovered,
    tanggalSembuh: isRecovered ? item.tgl : void 0
  };
});

// server.ts
initializeApp();
var db = getFirestore();
var app = express();
var PORT = 3e3;
var DATA_DIR = path.resolve(process.cwd(), "data");
var RECORDS_FILE = path.resolve(DATA_DIR, "records.json");
var META_FILE = path.resolve(DATA_DIR, "meta.json");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
var sharedRecords = [];
var lastUpdated = Date.now();
var serverVersion = "2.6.0";
try {
  const pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), "package.json"), "utf-8"));
  if (pkg.version) serverVersion = pkg.version;
} catch {
}
function saveRecordsToDisk(records) {
  try {
    sharedRecords = records;
    lastUpdated = Date.now();
    fs.writeFileSync(RECORDS_FILE, JSON.stringify(records, null, 2), "utf-8");
    fs.writeFileSync(
      META_FILE,
      JSON.stringify(
        {
          lastUpdated,
          version: serverVersion,
          totalRecords: records.length,
          savedAt: (/* @__PURE__ */ new Date()).toISOString()
        },
        null,
        2
      ),
      "utf-8"
    );
    return true;
  } catch (e) {
    console.error("[SERVER] Gagal menyimpan records ke disk:", e);
    return false;
  }
}
function loadRecordsFromDisk() {
  try {
    if (fs.existsSync(RECORDS_FILE)) {
      const data = fs.readFileSync(RECORDS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length >= initialEvacuationData.length) {
        if (fs.existsSync(META_FILE)) {
          try {
            const meta = JSON.parse(fs.readFileSync(META_FILE, "utf-8"));
            if (meta.lastUpdated) lastUpdated = Number(meta.lastUpdated);
          } catch {
          }
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error("[SERVER] Gagal membaca records.json:", e);
  }
  saveRecordsToDisk(initialEvacuationData);
  return initialEvacuationData;
}
sharedRecords = loadRecordsFromDisk();
var USERS_FILE = path.resolve(DATA_DIR, "users.json");
function loadUsersFromDisk() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("[SERVER] Gagal membaca users.json:", e);
  }
  const defaultAdmin = {
    uid: "admin-hendra",
    username: "hendra",
    email: "egahnd@gmail.com",
    name: "Hendra (Admin)",
    password: "101110",
    role: "superadmin",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  saveUsersToDisk([defaultAdmin]);
  return [defaultAdmin];
}
function saveUsersToDisk(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
    return true;
  } catch (e) {
    console.error("[SERVER] Gagal menulis users.json:", e);
    return false;
  }
}
var appUsers = loadUsersFromDisk();
app.use(express.json({ limit: "15mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use("/api", (req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
async function authMiddleware(req, _res, next) {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (!token) {
    req.user = { uid: "guest", role: "guest", username: "guest", name: "Tamu" };
    return next();
  }
  if (token.startsWith("session-")) {
    const parts = token.split("-");
    const uid = parts[1];
    const found = appUsers.find((u) => u.uid === uid || u.username === uid);
    if (found) {
      req.user = {
        uid: found.uid,
        username: found.username,
        email: found.email,
        name: found.name,
        role: found.role
      };
      return next();
    }
    if (uid === "hendra") {
      req.user = { uid: "admin-hendra", username: "hendra", email: "egahnd@gmail.com", name: "Hendra (Admin)", role: "superadmin" };
      return next();
    }
  }
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    let userDoc = await db.collection("users").doc(decodedToken.uid).get();
    if (!userDoc.exists && decodedToken.email === "egahnd@gmail.com") {
      await db.collection("users").doc(decodedToken.uid).set({
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: "superadmin",
        name: "Hendra (Admin)"
      });
      userDoc = await db.collection("users").doc(decodedToken.uid).get();
    }
    req.user.role = userDoc.data()?.role || (decodedToken.email === "egahnd@gmail.com" ? "superadmin" : "operator");
    return next();
  } catch {
    req.user = { uid: "guest", role: "guest", username: "guest", name: "Tamu" };
    next();
  }
}
app.use("/api", authMiddleware);
var checkRole = (allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user?.role || "guest")) {
    return res.status(403).json({ error: "Hak akses tidak mencukupi untuk melakukan tindakan ini." });
  }
  next();
};
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username dan password harus diisi." });
  }
  const cleanUser = String(username).trim().toLowerCase();
  const cleanPass = String(password).trim();
  if (cleanUser === "hendra" && cleanPass === "101110") {
    const adminUser = {
      uid: "admin-hendra",
      username: "hendra",
      name: "Hendra (Admin)",
      email: "egahnd@gmail.com",
      role: "superadmin"
    };
    const token = `session-hendra-${Date.now()}`;
    return res.json({
      success: true,
      token,
      user: adminUser
    });
  }
  const found = appUsers.find(
    (u) => (u.username.toLowerCase() === cleanUser || u.email.toLowerCase() === cleanUser) && u.password === cleanPass
  );
  if (found) {
    const token = `session-${found.uid}-${Date.now()}`;
    return res.json({
      success: true,
      token,
      user: {
        uid: found.uid,
        username: found.username,
        email: found.email,
        name: found.name || found.username,
        role: found.role
      }
    });
  }
  return res.status(401).json({ error: "Username atau password salah. Silakan coba kembali." });
});
app.get("/api/me", (req, res) => {
  res.json({
    uid: req.user.uid,
    username: req.user.username || req.user.email,
    name: req.user.name || req.user.username || req.user.email,
    email: req.user.email,
    role: req.user.role
  });
});
app.get("/api/health", checkRole(["superadmin", "operator", "guest"]), (_req, res) => {
  res.json({
    status: "ok",
    version: serverVersion,
    timestamp: Date.now(),
    totalRecords: sharedRecords.length
  });
});
app.get("/api/records", checkRole(["superadmin", "operator", "guest"]), (_req, res) => {
  res.json({
    records: sharedRecords,
    count: sharedRecords.length,
    lastUpdated,
    version: serverVersion
  });
});
app.get("/api/records/poll", checkRole(["superadmin", "operator", "guest"]), (req, res) => {
  const clientLastUpdated = Number(req.query.lastUpdated) || 0;
  res.json({
    lastUpdated,
    count: sharedRecords.length,
    hasUpdates: lastUpdated > clientLastUpdated,
    version: serverVersion
  });
});
app.post("/api/records", checkRole(["superadmin", "operator"]), (req, res) => {
  const { record } = req.body;
  if (!record || !record.nama) {
    return res.status(400).json({ error: "Data record tidak lengkap" });
  }
  const rec = {
    ...record,
    id: record.id || `rec-${record.no || Date.now()}-${Date.now()}`,
    isSembuh: record.isSembuh !== void 0 ? record.isSembuh : isRecordSembuh(record),
    lastEditedAt: (/* @__PURE__ */ new Date()).toISOString(),
    createdBy: req.user.uid
  };
  const existingIdx = sharedRecords.findIndex(
    (item) => item.id && rec.id && item.id === rec.id || rec.no && item.no === rec.no
  );
  let updatedList;
  if (existingIdx >= 0) {
    updatedList = [...sharedRecords];
    updatedList[existingIdx] = rec;
  } else {
    updatedList = [rec, ...sharedRecords];
  }
  saveRecordsToDisk(updatedList);
  res.json({
    success: true,
    record: rec,
    lastUpdated,
    count: sharedRecords.length
  });
});
app.post("/api/records/toggle-sembuh", checkRole(["superadmin", "operator"]), (req, res) => {
  const { id, no, isSembuh, tanggalSembuh } = req.body;
  const targetIdx = sharedRecords.findIndex(
    (item) => id && item.id === id || no && item.no === no
  );
  if (targetIdx < 0) {
    return res.status(404).json({ error: "Pasien tidak ditemukan" });
  }
  const rec = sharedRecords[targetIdx];
  const updatedRec = {
    ...rec,
    isSembuh: !!isSembuh,
    tanggalSembuh: isSembuh ? tanggalSembuh || rec.tanggalSembuh || (/* @__PURE__ */ new Date()).toLocaleDateString("id-ID") : void 0,
    lastEditedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  const updatedList = [...sharedRecords];
  updatedList[targetIdx] = updatedRec;
  saveRecordsToDisk(updatedList);
  res.json({
    success: true,
    record: updatedRec,
    lastUpdated,
    count: sharedRecords.length
  });
});
app.get("/api/users", checkRole(["superadmin"]), async (_req, res) => {
  if (!appUsers.some((u) => u.username === "hendra")) {
    appUsers.unshift({
      uid: "admin-hendra",
      username: "hendra",
      email: "egahnd@gmail.com",
      name: "Hendra (Admin)",
      password: "101110",
      role: "superadmin",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    saveUsersToDisk(appUsers);
  }
  const safeUsers = appUsers.map(({ password: _, ...rest }) => rest);
  res.json(safeUsers);
});
app.post("/api/users/role", checkRole(["superadmin"]), async (req, res) => {
  const { uid, role } = req.body;
  if (!uid || !["superadmin", "operator", "guest"].includes(role)) {
    return res.status(400).json({ error: "Data tidak valid" });
  }
  const target = appUsers.find((u) => u.uid === uid || u.username === uid);
  if (target) {
    target.role = role;
    saveUsersToDisk(appUsers);
  }
  try {
    await db.collection("users").doc(uid).update({ role });
  } catch {
  }
  res.json({ success: true });
});
app.post("/api/users/create", checkRole(["superadmin"]), async (req, res) => {
  const { username, email, name, password, role } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: "Mohon lengkapi username, password, dan hak akses." });
  }
  const cleanUser = String(username).trim().toLowerCase();
  if (appUsers.some((u) => u.username.toLowerCase() === cleanUser)) {
    return res.status(400).json({ error: "Username sudah digunakan oleh akun lain." });
  }
  const newUser = {
    uid: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    username: cleanUser,
    email: email ? String(email).trim() : `${cleanUser}@kesdam.local`,
    name: name ? String(name).trim() : cleanUser,
    password: String(password).trim(),
    role: role === "superadmin" ? "superadmin" : role === "guest" ? "guest" : "operator",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  appUsers.push(newUser);
  saveUsersToDisk(appUsers);
  try {
    await db.collection("users").doc(newUser.uid).set({
      uid: newUser.uid,
      username: newUser.username,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      createdAt: newUser.createdAt
    });
  } catch (err) {
    console.warn("[SERVER] Firestore sync warning:", err);
  }
  const { password: _, ...safeUser } = newUser;
  res.json({ success: true, user: safeUser });
});
app.post("/api/users/update", checkRole(["superadmin"]), async (req, res) => {
  const { uid, username, name, email, password, role } = req.body;
  if (!uid) {
    return res.status(400).json({ error: "UID pengguna tidak valid." });
  }
  const target = appUsers.find((u) => u.uid === uid || u.username === uid);
  if (!target) {
    return res.status(404).json({ error: "Pengguna tidak ditemukan." });
  }
  if (username) {
    const cleanUser = String(username).trim().toLowerCase();
    const collision = appUsers.find(
      (u) => u.username.toLowerCase() === cleanUser && u.uid !== target.uid
    );
    if (collision) {
      return res.status(400).json({ error: "Username sudah digunakan oleh akun lain." });
    }
    target.username = cleanUser;
  }
  if (name !== void 0) {
    target.name = String(name).trim() || target.username;
  }
  if (email !== void 0) {
    target.email = String(email).trim() || `${target.username}@kesdam.local`;
  }
  if (password && String(password).trim().length > 0) {
    target.password = String(password).trim();
  }
  if (role && ["superadmin", "operator", "guest"].includes(role)) {
    if (target.uid === "admin-hendra" || target.username === "hendra") {
      target.role = "superadmin";
    } else {
      target.role = role;
    }
  }
  saveUsersToDisk(appUsers);
  try {
    const updatePayload = {
      username: target.username,
      name: target.name,
      email: target.email,
      role: target.role
    };
    await db.collection("users").doc(target.uid).set(updatePayload, { merge: true });
  } catch (err) {
    console.warn("[SERVER] Firestore update warning:", err);
  }
  const { password: _, ...safeUser } = target;
  res.json({ success: true, user: safeUser });
});
app.post("/api/users/delete", checkRole(["superadmin"]), async (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "UID tidak valid." });
  if (uid === "admin-hendra" || uid === "hendra") {
    return res.status(400).json({ error: "Akun Super Admin utama tidak dapat dihapus." });
  }
  appUsers = appUsers.filter((u) => u.uid !== uid && u.username !== uid);
  saveUsersToDisk(appUsers);
  try {
    await db.collection("users").doc(uid).delete();
  } catch {
  }
  res.json({ success: true });
});
app.post("/api/records/batch", checkRole(["superadmin"]), (req, res) => {
  const { records, source } = req.body;
  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ error: "Array records kosong atau tidak valid" });
  }
  const existingByNo = /* @__PURE__ */ new Map();
  const existingBySrt = /* @__PURE__ */ new Map();
  sharedRecords.forEach((r) => {
    if (r.no) existingByNo.set(r.no, r);
    if (r.srt) existingBySrt.set(r.srt.trim().toLowerCase(), r);
  });
  const mergedList = records.map((newRec, idx) => {
    const existing = (newRec.no ? existingByNo.get(newRec.no) : void 0) || (newRec.srt ? existingBySrt.get(newRec.srt.trim().toLowerCase()) : void 0);
    return {
      ...newRec,
      id: existing?.id || newRec.id || `rec-${newRec.no || idx + 1}-${idx}`,
      isSembuh: existing?.isSembuh !== void 0 ? existing.isSembuh : newRec.isSembuh !== void 0 ? newRec.isSembuh : isRecordSembuh(newRec),
      tanggalSembuh: existing?.tanggalSembuh || newRec.tanggalSembuh,
      lastEditedAt: existing?.lastEditedAt || newRec.lastEditedAt || (/* @__PURE__ */ new Date()).toISOString()
    };
  });
  const mergedNos = new Set(mergedList.map((r) => r.no));
  sharedRecords.forEach((r) => {
    if (r.no && !mergedNos.has(r.no)) {
      mergedList.push(r);
    }
  });
  mergedList.sort((a, b) => (a.no || 0) - (b.no || 0));
  saveRecordsToDisk(mergedList);
  res.json({
    success: true,
    count: sharedRecords.length,
    lastUpdated,
    source: source || "batch_sync"
  });
});
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: "API Route Not Found" });
});
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";
  const httpServer = http.createServer(app);
  if (isProduction) {
    const distPath = path.resolve(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    }
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[KESDAM SERVER] Running at http://0.0.0.0:${PORT}`);
    console.log(`[KESDAM SERVER] Multi-device synchronization active for ${sharedRecords.length} records.`);
  });
}
startServer().catch((err) => {
  console.error("[KESDAM SERVER] Error starting server:", err);
  process.exit(1);
});
