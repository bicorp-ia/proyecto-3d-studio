import React, { useState } from 'react';
import { ArrowRight, Check, Cpu, Filter, Flame, Gauge, Info, Shield, Sparkles, Zap } from 'lucide-react';
import { MATERIALS, TECHNOLOGIES } from '../data/materials';
import { Material, TechnologyType } from '../types';

interface MaterialCatalogProps {
  onSelectMaterial: (material: Material) => void;
}

export const MaterialCatalog: React.FC<MaterialCatalogProps> = ({ onSelectMaterial }) => {
  const [selectedTech, setSelectedTech] = useState<TechnologyType | 'all'>('all');
  const [search, setSearch] = useState('');

  const filteredMaterials = MATERIALS.filter((m) => {
    const matchesTech = selectedTech === 'all' || m.technology === selectedTech;
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase()) ||
      m.recommendedUse.toLowerCase().includes(search.toLowerCase());
    return matchesTech && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Visual Industrial Hero Showcase with Generated Imagery */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900/60 p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="max-w-xl z-10">
          <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
            Base Tecnológica Proyect3d
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-100 tracking-tight leading-tight">
            Materiales de Ingeniería Certificados & Tolerancias ISO 2768
          </h2>
          <p className="text-xs sm:text-sm text-neutral-300 mt-3 leading-relaxed">
            Desde polímeros técnicos de alto rendimiento (PEEK, Nylon PA12-CF) hasta sinterizado láser industrial (SLS) y
            mecanizado CNC de precisión en aleaciones aeroespaciales (Aluminio 7075-T6, Acero Inoxidable 316L).
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-6 text-xs text-neutral-300">
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-400" />
              ISO 9001:2015 Certificado
            </span>
            <span className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-amber-400" />
              Tolerancia hasta ±0.02 mm
            </span>
            <span className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-red-400" />
              Resistencia térmica hasta 350°C
            </span>
          </div>
        </div>

        {/* Industrial Facility Showcase Image */}
        <div className="w-full md:w-80 h-52 rounded-xl overflow-hidden border border-neutral-800 shrink-0 relative shadow-2xl bg-neutral-950">
          <img
            src="/src/assets/images/hero_3d_industrial_1791195085445.jpg"
            alt="Instalación Industrial Proyect3d"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent flex items-end p-3">
            <span className="text-[11px] font-mono text-neutral-200">
              Centro de Fabricación Aditiva & CNC Proyect3d
            </span>
          </div>
        </div>
      </div>

      {/* Industrial Technology Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between">
          <div className="w-full h-36 rounded-lg overflow-hidden bg-neutral-950 mb-3 border border-neutral-800">
            <img
              src="/src/assets/images/aerospace_bracket_1791195095642.jpg"
              alt="Soporte Aeroespacial Topológico"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="text-xs font-mono text-amber-400">OPTIMIZACIÓN TOPOLÓGICA</div>
            <div className="text-sm font-bold text-neutral-100 mt-0.5">Soportes Estructurales Ligeros</div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Fabricación en Nylon PA12-CF con 20% fibra de carbono continua para máxima rigidez y sustitución de aluminio.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between">
          <div className="w-full h-36 rounded-lg overflow-hidden bg-neutral-950 mb-3 border border-neutral-800">
            <img
              src="/src/assets/images/hydraulic_manifold_1791195105596.jpg"
              alt="Manifold Hidráulico SLS"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="text-xs font-mono text-amber-400">MICROFLUÍDICA & SLS</div>
            <div className="text-sm font-bold text-neutral-100 mt-0.5">Bloques Manifold con Canales CFD</div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Poliamida sinterizada isotrópica sin soportes internos. Estanqueidad garantizada contra fugas de presión.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/50 flex flex-col justify-between">
          <div className="w-full h-36 rounded-lg overflow-hidden bg-neutral-950 mb-3 border border-neutral-800">
            <img
              src="/src/assets/images/cnc_machined_part_1791195115127.jpg"
              alt="Mecanizado CNC 5 Ejes"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="text-xs font-mono text-amber-400">CNC 5 EJES ALTA PRECISIÓN</div>
            <div className="text-sm font-bold text-neutral-100 mt-0.5">Rodetes & Turbinas en Al 7075-T6</div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Acabado espejo y tolerancias micrométricas según norma ISO 2768-f para componentes de alta fatiga.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800">
        {/* Technology filter segmented control */}
        <div className="flex items-center gap-1.5 p-1 bg-neutral-900/90 border border-neutral-800 rounded-lg overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setSelectedTech('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              selectedTech === 'all'
                ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Todos ({MATERIALS.length})
          </button>
          {TECHNOLOGIES.map((tech) => (
            <button
              key={tech.id}
              onClick={() => setSelectedTech(tech.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap uppercase ${
                selectedTech === tech.id
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {tech.id}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <input
          type="text"
          placeholder="Filtrar por nombre, temperatura o aplicación..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      {/* Material Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((mat) => (
          <div
            key={mat.id}
            className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  {mat.technology}
                </span>
                <span className="text-xs font-mono font-semibold text-neutral-300 tabular-nums">
                  {(mat.costPerGram * 1000).toFixed(0)} €/kg
                </span>
              </div>

              <h4 className="text-sm font-bold text-neutral-100 mt-2.5 group-hover:text-amber-400 transition-colors">
                {mat.name}
              </h4>
              <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
                {mat.description}
              </p>

              {/* Technical specs matrix */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-neutral-800 text-[11px]">
                <div>
                  <span className="text-neutral-500 block">Resistencia Tracción:</span>
                  <span className="font-mono text-neutral-200 font-semibold">{mat.tensileStrength}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Temperatura HDT:</span>
                  <span className="font-mono text-amber-400 font-semibold">{mat.heatDeflection}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Espesor Mínimo:</span>
                  <span className="font-mono text-neutral-200 font-semibold">≥ {mat.minWallThicknessMm} mm</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Densidad:</span>
                  <span className="font-mono text-neutral-200 font-semibold">{mat.density} g/cm³</span>
                </div>
              </div>

              <div className="mt-3 text-[11px] text-neutral-400">
                <span className="text-neutral-500">Uso idóneo:</span> {mat.recommendedUse}
              </div>
            </div>

            <button
              onClick={() => onSelectMaterial(mat)}
              className="mt-5 w-full py-2 px-3 text-xs font-semibold rounded-lg bg-neutral-800 hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 transition-all flex items-center justify-center gap-1.5 group-hover:shadow-md"
            >
              <span>Configurar en Cotizador</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
