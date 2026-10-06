import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Calendar, CheckCircle2, Clock, Loader2, Sparkles, User, Video, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { scheduleMeetingInFirestore } from '../firebase/dbService';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  defaultCompany?: string;
}

export const ScheduleMeetingModal: React.FC<ScheduleMeetingModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  defaultCompany = '',
}) => {
  const [name, setName] = useState('Ing. Carlos Valdés');
  const [email, setEmail] = useState(defaultEmail || 'carlos.valdes@tecnorobotics.com');
  const [company, setCompany] = useState(defaultCompany || 'TecnoRobotics Industrial S.A.');
  const [date, setDate] = useState('2026-10-08');
  const [time, setTime] = useState('11:00');
  const [topic, setTopic] = useState('Validación de Tolerancias ISO 2768 y Selección de Materiales');
  const [notes, setNotes] = useState('Revisión de ensamble mecánico y viabilidad de insertos roscados M4.');

  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<{ meetingId: string; message: string } | null>(null);

  const { currentUser } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/lead/meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          company,
          date,
          time,
          topic,
          projectDetails: notes,
        }),
      });

      const data = await response.json();
      const meetingId = data.meetingId || `MTG-${Math.floor(10000 + Math.random() * 90000)}`;

      // Persist to Firestore
      try {
        await scheduleMeetingInFirestore({
          meetingId,
          userId: currentUser?.uid,
          name,
          email,
          company,
          date,
          time,
          topic,
          projectDetails: notes,
          createdAt: new Date().toISOString(),
        });
      } catch (fErr) {
        console.warn('Firestore meeting save error:', fErr);
      }

      setConfirmation({
        meetingId,
        message: data.message || `Reunión agendada para el ${date} a las ${time}h con enlace Google Meet enviado a ${email}.`,
      });

      confetti({
        particleCount: 40,
        spread: 50,
      });
    } catch (err) {
      console.error('Error scheduling meeting:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-100">Sesión Técnica con Ingeniero Sénior</h3>
              <p className="text-xs text-neutral-400">Asesoramiento gratuito en diseño DFAM y tolerancias ISO 2768</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmation ? (
          <div className="p-6 text-center flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-neutral-100">Cita Técnica Confirmada</h4>
            <div className="text-xs font-mono text-amber-400 font-semibold mt-1">
              Localizador: {confirmation.meetingId}
            </div>
            <p className="text-xs text-neutral-300 mt-3 max-w-sm leading-relaxed">
              {confirmation.message}
            </p>
            <div className="mt-4 p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-left w-full space-y-1">
              <div className="text-neutral-400">Especialista asignado: <strong className="text-neutral-200">Dr. Marcos Reig (Lead Application Engineer)</strong></div>
              <div className="text-neutral-400">Plataforma: <strong className="text-amber-400">Google Meet (Enlace remitido a {email})</strong></div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full py-2.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1 block">Nombre y Apellidos:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1 block">Empresa:</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Email Corporativo:</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1 block">Fecha Deseada:</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-300 mb-1 block">Hora (Madrid / CET):</label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="09:30">09:30 CET</option>
                  <option value="11:00">11:00 CET</option>
                  <option value="13:00">13:00 CET</option>
                  <option value="16:00">16:00 CET</option>
                  <option value="17:30">17:30 CET</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Motivo Técnico de Consulta:</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Validación de Tolerancias ISO 2768 y Selección de Materiales">
                  Validación de Tolerancias ISO 2768 y Selección de Materiales
                </option>
                <option value="Optimización Topológica DFAM para Fabricación Aditiva">
                  Optimización Topológica DFAM para Fabricación Aditiva
                </option>
                <option value="Sustitución de Componentes Metálicos por PEEK o Nylon CF">
                  Sustitución de Componentes Metálicos por PEEK o Nylon CF
                </option>
                <option value="Cotización de Series Medianas B2B (&gt;500 unidades)">
                  Cotización de Series Medianas B2B (&gt;500 unidades)
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 mb-1 block">Detalles del Ensamble o Requerimientos:</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 text-xs font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-neutral-950 transition-colors flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Reservando...
                  </>
                ) : (
                  <>
                    <Calendar className="w-3.5 h-3.5" />
                    Confirmar Reunión Técnica
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
