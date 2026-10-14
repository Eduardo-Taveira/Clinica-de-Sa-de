import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const ID = {
  locationCentro: "70000000-0000-4000-8000-000000000001",
  locationCampolim: "70000000-0000-4000-8000-000000000002",
  locationVotorantim: "70000000-0000-4000-8000-000000000003",
  doctorDefault: "80000000-0000-4000-8000-000000000001",
};

const specialties = [
  "Clínica geral", "Cardiologia", "Dermatologia", "Pediatria", "Ortopedia",
  "Ginecologia", "Neurologia", "Oftalmologia", "Endocrinologia", "Psiquiatria",
  "Geriatria", "Otorrinolaringologia",
];

// Nomes e credenciais são fictícios. As unidades usam somente bairros,
// pois o projeto não deve sugerir que consultórios reais existam ali.
const doctors = [
  { name: "Dra. Ana Martins", specialty: 0, units: [[0, [1, 2, 3, 4, 5]]] },
  { name: "Dr. Rafael Costa", specialty: 0, units: [[2, [1, 2, 3, 4, 5]]] },
  { name: "Dra. Beatriz Lima", specialty: 1, units: [[1, [1, 3, 5]]] },
  { name: "Dr. Lucas Ferreira", specialty: 2, units: [[0, [2, 4]]] },
  { name: "Dra. Mariana Rocha", specialty: 3, units: [[2, [1, 3, 5]]] },
  { name: "Dr. Pedro Ribeiro", specialty: 4, units: [[1, [2, 4]]] },
  { name: "Dra. Camila Santos", specialty: 5, units: [[0, [1, 3, 5]]] },
  { name: "Dr. Felipe Almeida", specialty: 6, units: [[1, [1, 3, 5]]] },
  { name: "Dra. Juliana Teixeira", specialty: 7, units: [[0, [2, 4]]] },
  { name: "Dr. Bruno Oliveira", specialty: 8, units: [[2, [2, 4]]] },
  { name: "Dra. Letícia Barbosa", specialty: 9, units: [[1, [2, 4]]] },
  { name: "Dr. Henrique Dias", specialty: 10, units: [[0, [1, 3, 5]]] },
  { name: "Dra. Sofia Nunes", specialty: 11, units: [[2, [1, 3, 5]]] },
  { name: "Dr. Gustavo Moreira", specialty: 1, units: [[0, [2, 4]], [2, [1, 3, 5]]] },
] as const;

async function main() {
  const locations = [
    { id: ID.locationCentro, name: "Unidade Centro", city: "Sorocaba", neighborhood: "Centro", address: null },
    { id: ID.locationCampolim, name: "Unidade Campolim", city: "Sorocaba", neighborhood: "Parque Campolim", address: null },
    { id: ID.locationVotorantim, name: "Unidade Votorantim", city: "Votorantim", neighborhood: "Centro", address: null },
  ];
  for (const loc of locations) {
    await prisma.clinicLocation.upsert({ where: { id: loc.id }, update: { ...loc, active: true }, create: loc });
  }
  for (let i = 0; i < specialties.length; i++) {
    const id = `60000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;
    await prisma.specialty.upsert({ where: { id }, update: { name: specialties[i] }, create: { id, name: specialties[i] } });
  }
  for (let i = 0; i < doctors.length; i++) {
    const item = doctors[i];
    const id = `80000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;
    const specialtyId = `60000000-0000-4000-8000-${String(item.specialty + 1).padStart(12, "0")}`;
    const registration = `DEMO-${String(i + 1).padStart(3, "0")}`;
    await prisma.doctor.upsert({
      where: { id },
      update: { name: item.name, registration, specialtyId, active: true },
      create: { id, name: item.name, registration, specialtyId },
    });
    for (const [unitIndex, weekdays] of item.units) {
      const locationId = locations[unitIndex].id;
      await prisma.doctorLocation.upsert({
        where: { doctorId_locationId: { doctorId: id, locationId } },
        update: { weekdays: [...weekdays] },
        create: { doctorId: id, locationId, weekdays: [...weekdays] },
      });
    }
  }
  // Atualização não destrutiva: associa consultas V2 ao primeiro médico e unidade.
  const migrated = await prisma.appointment.updateMany({
    where: { doctorId: null },
    data: { doctorId: ID.doctorDefault, locationId: ID.locationCentro },
  });
  console.log(`Catálogo: ${specialties.length} especialidades, ${doctors.length} médicos, ${locations.length} unidades.`);
  console.log(`Consultas V2 associadas à unidade padrão: ${migrated.count}.`);
  console.log("ATENÇÃO: dados demonstrativos; endereços completos e registros profissionais não são reais.");
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });
