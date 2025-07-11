import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { GeradorOrdemServico } from "./geradorOrdermPdf";

const dadosExemplo = {
  id: "cmcyvj5sd00077ffc29q5dwds",
  clientId: "cmcyvj5ro00027ffcpnchlrjy",
  vehicleId: "cmcyvj5rw00047ffcckw1akdg",
  status: "COMPLETED",
  description: "MANUTENÇÃO CORRETIVA",
  kilometers: 45000,
  discount: "100",
  totalValue: "70.4",
  createdAt: "2025-07-10T13:50:10.190Z",
  updatedAt: "2025-07-11T13:50:10.190Z",
  client: {
    id: "cmcyvj5ro00027ffcpnchlrjy",
    name: "JOHN DOE CLIENT",
    cpfCnpj: "47022391041",
    phone: "27997876754",
    email: "johndoe@example.com",
  },
  vehicle: {
    id: "cmcyvj5rw00047ffcckw1akdg",
    plate: "PPW1020",
    model: "ARGO",
    brand: "FIAT",
    year: 2018,
  },
  services: [
    {
      id: "cmcyvo25d004k7f9ovgvp3mhj",
      orderId: "cmcyvo258004j7f9o5c5bqo22",
      description: "troca de oleo",
      price: "30",
      createdAt: "2025-07-11T13:53:58.754Z",
      updatedAt: "2025-07-11T13:53:58.754Z",
    },
    {
      id: "cmcyvo25d004l7f9omjbvk77n",
      orderId: "cmcyvo258004j7f9o5c5bqo22",
      description: "troca de filtro",
      price: "40",
      createdAt: "2025-07-11T13:53:58.754Z",
      updatedAt: "2025-07-11T13:53:58.754Z",
    },
  ],
  items: [
    {
      id: "cmcyvo25j004m7f9oe2imofl8",
      orderId: "cmcyvo258004j7f9o5c5bqo22",
      partId: "cmcyvo250004h7f9o0o6i883n",
      quantity: 2,
      unitPrice: "50.2",
      createdAt: "2025-07-11T13:53:58.760Z",
      updatedAt: "2025-07-11T13:53:58.760Z",
      part: {
        id: "cmcyvo250004h7f9o0o6i883n",
        name: "FILTRO COMBUSTIVEL",
        unitPrice: "50.2",
      },
    },
  ],
};

export async function pdfRoutes(app: FastifyInstance) {
  app.get("/order-pdf", async (req: FastifyRequest, res: FastifyReply) => {
    try {
      const pdf = await GeradorOrdemServico.gerarPDFRapidoJson(
        dadosExemplo,
        "ordem_servico_exemplo.pdf"
      );

      res.header("Content-Type", "application/pdf").send(pdf);
    } catch (error) {
      console.error("Erro ao gerar OS:", error);
      res.status(500).send({ error: "Erro interno do servidor" });
    }
  });

  app.get("/order-html", async (req: FastifyRequest, res: FastifyReply) => {
    try {
      const gerador = new GeradorOrdemServico();
      await gerador.inicializar();

      const html = await gerador.gerarHTML(
        dadosExemplo,
        "ordem_servico_preview.html"
      );

      await gerador.finalizar();
      res.header("Content-Type", "text/html").send(html);
    } catch (error) {
      console.error("Erro ao gerar OS:", error);
      res.status(500).send({ error: "Erro interno do servidor" });
    }
  });
}
