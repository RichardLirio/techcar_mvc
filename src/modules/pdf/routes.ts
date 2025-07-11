import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { dadosExemplo, GeradorOrdemServico } from "./geradorOrdermPdf";

export async function pdfRoutes(app: FastifyInstance) {
  app.get("/gerar-os", async (req: FastifyRequest, res: FastifyReply) => {
    try {
      const gerador = new GeradorOrdemServico();
      await gerador.inicializar();
      const pdf = await gerador.gerarPDF(dadosExemplo, "ordem_servico_1.pdf");

      await gerador.finalizar();
      res.header("Content-Type", "application/pdf").send(pdf);
    } catch (error) {
      console.error("Erro ao gerar OS:", error);
      res.status(500).send({ error: "Erro interno do servidor" });
    }
  });
}
