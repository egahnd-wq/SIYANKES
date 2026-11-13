import React from 'react';
import { EvacuationRecord } from '../types/evacuation';
import { KodamCenderawasihLogo, HestiWiraSaktiLogo } from './MilitaryLogos';

interface LetterPrintTemplateProps {
  record: EvacuationRecord;
}

export const LetterPrintTemplate: React.FC<LetterPrintTemplateProps> = ({ record }) => {
  return (
    <div className="hidden print:block print:w-full p-8 text-black bg-white" id="print-letter-template">
      {/* Header Kop Surat */}
      <div className="border-b-4 border-black pb-4 mb-6 flex justify-between items-center">
        <div className="w-24 flex items-center justify-center"><KodamCenderawasihLogo is3DGlass={false} className="w-20 h-20 object-contain" /></div>
        <div className="text-center">
          <h1 className="text-lg font-bold">KOMANDO DAERAH MILITER XVII / CENDERAWASIH</h1>
          <h2 className="text-md font-semibold">KESEHATAN</h2>
          <p className="text-sm">Jalan Ahmad Yani No. 8, Jayapura</p>
        </div>
        <div className="w-24 flex items-center justify-center"><HestiWiraSaktiLogo is3DGlass={false} className="w-20 h-20 object-contain" /></div>
      </div>

      {/* Surat Header */}
      <div className="text-center mb-6">
        <h3 className="font-bold underline text-lg">SURAT PERMOHONAN EVAKUASI MEDIS</h3>
        <p>Nomor: {record.srt}</p>
      </div>

      {/* Isi Surat */}
      <div className="mb-6 leading-relaxed">
        <p>Dengan hormat,</p>
        <p className="mt-2">Bersama ini kami sampaikan permohonan evakuasi medis untuk pasien dengan data sebagai berikut:</p>
        
        <table className="mt-4 w-full border-collapse">
          <tbody>
            <tr><td className="w-1/3">Nama</td><td>: {record.nama}</td></tr>
            <tr><td>Umur</td><td>: {record.umur}</td></tr>
            <tr><td>Pangkat/NRP/Identitas</td><td>: {record.identitas}</td></tr>
            <tr><td>Jabatan</td><td>: {record.jabatan}</td></tr>
            <tr><td>Kesatuan</td><td>: {record.kesatuan}</td></tr>
            <tr><td>Diagnosa</td><td>: {record.diag}</td></tr>
            <tr><td>Faskes Asal</td><td>: {record.asal}</td></tr>
            <tr><td>Faskes Tujuan</td><td>: {record.tujuan}</td></tr>
            <tr><td>Alat Angkut / Moda Transportasi</td><td>: {record.moda || 'Pesawat'}</td></tr>
            <tr><td>Pendamping</td><td>: {record.pendamping}</td></tr>
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-end">
        <div className="text-center">
          <p>Jayapura, {record.tgl}</p>
          <p className="mt-16">( ______________________ )</p>
        </div>
      </div>
    </div>
  );
};
