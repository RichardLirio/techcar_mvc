import puppeteer, { Browser, Page, PDFOptions } from "puppeteer";
import fs from "fs/promises";
import { writeFileSync } from "fs";
import { Decimal } from "@prisma/client/runtime/library";

// Interfaces para tipagem
interface Oficina {
  nome: string;
  endereco: string;
  cidade: string;
  telefone: string;
  cnpj: string;
}

interface Cliente {
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  cidade: string;
  cpfCnpj: string;
}

interface Veiculo {
  marca: string;
  modelo: string;
  ano: string;
  placa: string;
  km: string;
}

interface ItemServico {
  descricao: string;
  valor: number;
}

interface ItemPeca {
  descricao: string;
  valor: number;
}

type StatusOS = "Em andamento" | "Concluído" | "Cancelado";

interface DadosOrdemServico {
  numero: string;
  data: string;
  hora: string;
  oficina: Oficina;
  cliente: Cliente;
  veiculo: Veiculo;
  desconto: number;
  servicos: ItemServico[];
  pecas: ItemPeca[];
  observacoes?: string;
  status: StatusOS;
}

interface ConfiguracaoPDF {
  format?: "A4" | "A3" | "Letter";
  printBackground?: boolean;
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
}

// Interface para os dados do JSON
interface OrdemServicoJSON {
  id: string;
  clientId: string;
  vehicleId: string;
  status: string;
  description: string | null;
  kilometers: number;
  discount: Decimal;
  totalValue: Decimal;
  createdAt: Date;
  updatedAt: Date;
  client: {
    id: string;
    name: string;
    cpfCnpj: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  };
  vehicle: {
    id: string;
    plate: string;
    model: string;
    brand: string;
    year: number | null;
  };
  services: {
    id: string;
    orderId: string;
    description: string;
    price: Decimal;
    createdAt: Date;
    updatedAt: Date;
  }[];
  items: {
    id: string;
    orderId: string;
    partId: string;
    quantity: number;
    unitPrice: Decimal;
    createdAt: Date;
    updatedAt: Date;
    part: {
      id: string;
      name: string;
      unitPrice: Decimal;
    };
  }[];
}

// Classe principal para geração de ordem de serviço
export class GeradorOrdemServico {
  private browser: Browser | null = null;

  constructor() {}

  // Inicializar o browser
  async inicializar(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  // Finalizar o browser
  async finalizar(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Converter JSON para DadosOrdemServico
  private converterJsonParaOrdemServico(
    json: OrdemServicoJSON
  ): DadosOrdemServico {
    const createdAt = new Date(json.createdAt);

    // Mapear o status do JSON para StatusOS
    const mapStatus = (status: string): StatusOS => {
      switch (status) {
        case "IN_PROGRESS":
          return "Em andamento";
        case "COMPLETED":
          return "Concluído";
        case "CANCELLED":
          return "Cancelado";
        default:
          throw new Error(`Status desconhecido: ${status}`);
      }
    };

    return {
      numero: json.id,
      data: createdAt.toLocaleDateString("pt-BR"),
      hora: createdAt.toLocaleTimeString("pt-BR"),
      oficina: {
        nome: "Oficina Alta Rotação",
        endereco: "Rua Odineir de Freitas Castro, 144 - Jardim Camburi",
        cidade: "Vitória - ES",
        telefone: "(27) 3019-4945",
        cnpj: "30.444.425/0001-50",
      },
      cliente: {
        nome: json.client.name,
        telefone: json.client.phone ? json.client.phone : "Não informado",
        email: json.client.email ? json.client.email : "Não informado",
        endereco: json.client.address ? json.client.address : "Não informado", // Não presente no JSON
        cidade: "Não informado", // Não presente no JSON
        cpfCnpj: json.client.cpfCnpj,
      },
      veiculo: {
        marca: json.vehicle.brand,
        modelo: json.vehicle.model,
        ano: json.vehicle.year ? json.vehicle.year.toString() : "Não informado",
        placa: json.vehicle.plate,
        km: json.kilometers.toString(),
      },
      servicos: json.services.map((servico) => ({
        descricao: servico.description,
        valor: Number(servico.price),
      })),
      pecas: json.items.map((item) => ({
        descricao: `${item.part.name} (x${item.quantity})`,
        valor: Number(item.unitPrice) * item.quantity,
      })),
      observacoes: json.description ? json.description : "Não informado",
      status: mapStatus(json.status),
      desconto: Number(json.discount) || 0,
    };
  }

  // Calcular totais
  private calcularTotais(dados: DadosOrdemServico): {
    totalServicos: number;
    totalPecas: number;
    desconto: number;
    totalGeral: number;
  } {
    const totalServicos = dados.servicos.reduce(
      (total, servico) => total + servico.valor,
      0
    );
    const totalPecas = dados.pecas.reduce(
      (total, peca) => total + peca.valor,
      0
    );
    const desconto = dados.desconto || 0;
    const totalGeral = totalServicos + totalPecas - desconto;

    return { totalServicos, totalPecas, desconto, totalGeral };
  }

  // Formatar valor para moeda brasileira
  private formatarMoeda(valor: number): string {
    return valor.toFixed(2).replace(".", ",");
  }

  // Gerar classe CSS para status
  private obterClasseStatus(status: StatusOS): string {
    return status.toLowerCase().replace(" ", "-");
  }

  // Gerar HTML da ordem de serviço
  private gerarHTMLOrdemServico(dados: DadosOrdemServico): string {
    const { totalServicos, totalPecas, desconto, totalGeral } =
      this.calcularTotais(dados);

    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ordem de Serviço ${dados.numero}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 10mm;
            color: #333;
            line-height: 1.2;
            background-color: #f5f5f5;
            font-size: 10px;
          }
          
          .container {
            max-width: 190mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            border-radius: 4px;
            overflow: hidden;
          }
          
          .header {
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            color: white;
            padding: 10px 12px;
            margin-bottom: 0;
          }
          
          .header h1 {
            margin: 0;
            font-size: 16px;
            font-weight: 700;
            text-align: center;
          }
          
          .header h2 {
            margin: 4px 0 0 0;
            font-size: 12px;
            font-weight: 300;
            text-align: center;
            opacity: 0.9;
          }
          
          .header .info-header {
            margin-top: 6px;
            font-size: 9px;
            opacity: 0.8;
            text-align: center;
          }
          
          .header .oficina-info {
            font-size: 8px;
            margin-top: 4px;
            opacity: 0.8;
            text-align: center;
          }
          
          .content {
            padding: 10px;
          }
          
          .info-section {
            margin-bottom: 12px;
            padding: 8px;
            background: #f8f9fa;
            border-left: 2px solid #007bff;
            border-radius: 0 3px 3px 0;
          }
          
          .info-section h3 {
            margin: 0 0 6px 0;
            color: #2c3e50;
            font-size: 11px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          
          .info-item {
            margin-bottom: 3px;
            padding: 3px 0;
            border-bottom: 1px solid #eee;
            font-size: 9px;
          }
          
          .info-item:last-child {
            border-bottom: none;
          }
          
          .info-item strong {
            color: #2c3e50;
            font-weight: 600;
          }
          
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            border-radius: 3px;
            overflow: hidden;
            font-size: 9px;
          }
          
          .table th,
          .table td {
            padding: 5px 6px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          
          .table th {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 8px;
            letter-spacing: 0.2px;
          }
          
          .table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .table tr:hover {
            background-color:  #e9ecef;
            transition: background-color 0.2s ease;
          }
          
          .table tfoot tr {
            background: #e9ecef !important;
            font-weight: 600;
          }
          
          .valor {
            text-align: right;
            font-weight: 600;
            color: #27ae60;
          }

          .valor-deconto {
            text-align: right;
            font-weight: 600;
            color: #c7300a;
          }
          
          .total-section {
            margin-bottom: 12px;
          }
          
          .total-section h3 {
            margin: 0 0 6px 0;
            color: #2c3e50;
            font-size: 11px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
          }
          
          .total-section .table tfoot tr {
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%) !important;
            color: white;
          }
          
          .total-section .table tfoot .valor {
            color: white;
          }
          
          .status {
            display: inline-block;
            padding: 3px 6px;
            border-radius: 10px;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 8px;
            letter-spacing: 0.2px;
          }
          
          .status.em-andamento {
            background: #ffc107;
            color: #856404;
          }
          
          .status.concluído {
            background: #28a745;
            color: white;
          }
          
          .status.aguardando {
            background: #17a2b8;
            color: white;
          }
          
          .status.cancelado {
            background: #dc3545;
            color: white;
          }
          
          .observacoes {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 3px;
            padding: 8px;
            margin: 10px 0;
            font-size: 9px;
          }
          
          .observacoes h4 {
            margin: 0 0 4px 0;
            color: #856404;
            font-size: 10px;
          }
          
          .footer {
            margin-top: 15px;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 8px;
            color: #666;
            font-size: 8px;
          }
          
          .assinatura {
            margin-top:40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
          
          .assinatura-item {
            text-align: center;
            padding-top: 12px;
            border-top: 1px solid #333;
            font-weight: 600;
            font-size: 9px;
          }
          
          .icon {
            font-size: 10px;
            margin-right: 4px;
          }
          
          /* Estilos específicos para impressão/PDF */
          @media print {
            body {
              padding: 0;
              background: white;
              font-size: 9px;
            }
            
            .container {
              box-shadow: none;
              border-radius: 0;
              max-width: none;
              margin: 0;
            }
            
            .header {
              background: #2c3e50 !important;
              padding: 8px 10px;
            }
            
            .header h1 {
              font-size: 14px;
            }
            
            .header h2 {
              font-size: 11px;
            }
            
            .content {
              padding: 8px;
            }
            
            .info-section {
              margin-bottom: 10px;
              padding: 6px;
            }
            
            .info-section h3 {
              font-size: 10px;
              margin-bottom: 4px;
            }
            
            .info-grid {
              gap: 10px;
            }
            
             .total-section {
              margin-bottom: 10px;
            }
            
            .total-section h3 {
              font-size: 10px;
            }
            
            .table {
              font-size: 8px;
              margin-bottom: 10px;
            }
            
            .table th,
            .table td {
              padding: 4px 5px;
            }
            
            .assinatura {
              margin-top: 40px;
              gap: 25px;
            }
            
            .assinatura-item {
              padding-top: 10px;
              font-size: 8px;
            }
            
            .footer {
              margin-top: 12px;
              padding-top: 6px;
              font-size: 7px;
            }
            
            .observacoes {
              padding: 6px;
              margin: 8px 0;
              font-size: 8px;
            }
            
            .observacoes h4 {
              font-size: 9px;
            }
          }
          
          @media (max-width: 768px) {
            .info-grid {
              grid-template-columns: 1fr;
              gap: 8px;
            }
            
            .assinatura {
              grid-template-columns: 1fr 1fr;
              gap: 25px;
            }
            
            .table {
              font-size: 8px;
            }
            
            .table th,
            .table td {
              padding: 4px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${dados.oficina.nome}</h1>
            <h2>ORDEM DE SERVIÇO</h2>
            <div class="info-header">
              <strong>Nº: ${dados.numero}</strong> | 
              <strong>Data: ${dados.data}</strong> | 
              <strong>Hora: ${dados.hora}</strong>
            </div>
            <div class="oficina-info">
              ${dados.oficina.endereco} | ${dados.oficina.cidade} | 
              Tel: ${dados.oficina.telefone} | CNPJ: ${dados.oficina.cnpj}
            </div>
          </div>
          
          <div class="content">
            <div class="info-section">
              <h3><span class="icon">👤</span>Dados do Cliente e Veículo</h3>
              <div class="info-grid">
                <div>
                  <div class="info-item"><strong>Cliente:</strong> ${
                    dados.cliente.nome
                  }</div>
                  <div class="info-item"><strong>Telefone:</strong> ${
                    dados.cliente.telefone
                  }</div>
                  <div class="info-item"><strong>Email:</strong> ${
                    dados.cliente.email
                  }</div>
                  <div class="info-item"><strong>CPF:</strong> ${
                    dados.cliente.cpfCnpj
                  }</div>
                </div>
                <div>
                  <div class="info-item"><strong>Marca/Modelo:</strong> ${
                    dados.veiculo.marca
                  } ${dados.veiculo.modelo}</div>
                  <div class="info-item"><strong>Ano:</strong> ${
                    dados.veiculo.ano
                  }</div>
                  <div class="info-item"><strong>Placa:</strong> ${
                    dados.veiculo.placa
                  }</div>
                  <div class="info-item"><strong>KM:</strong> ${
                    dados.veiculo.km
                  }</div>
                </div>
              </div>
            </div>
            
            <div class="info-section">
              <h3><span class="icon">🔧</span>Serviços Executados</h3>
              <table class="table">
                <thead>
                  <tr>
                    <th>Descrição do Serviço</th>
                    <th style="width: 80px;">Valor (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  ${dados.servicos
                    .map(
                      (servico) => `
                    <tr>
                      <td>${servico.descricao}</td>
                      <td class="valor">R$ ${this.formatarMoeda(
                        servico.valor
                      )}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Subtotal Serviços</strong></td>
                    <td class="valor"><strong>R$ ${this.formatarMoeda(
                      totalServicos
                    )}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div class="info-section">
              <h3><span class="icon">🔩</span>Peças Utilizadas</h3>
              <table class="table">
                <thead>
                  <tr>
                    <th>Descrição da Peça</th>
                    <th style="width: 80px;">Valor (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  ${dados.pecas
                    .map(
                      (peca) => `
                    <tr>
                      <td>${peca.descricao}</td>
                      <td class="valor">R$ ${this.formatarMoeda(
                        peca.valor
                      )}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Subtotal Peças</strong></td>
                    <td class="valor"><strong>R$ ${this.formatarMoeda(
                      totalPecas
                    )}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
               <div class="info-section total-section">
              <h3><span class="icon">💰</span>Total</h3>
              <table class="table">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th style="width: 80px;">Valor (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Subtotal Serviços</td>
                    <td class="valor">R$ ${this.formatarMoeda(
                      totalServicos
                    )}</td>
                  </tr>
                  <tr>
                    <td>Subtotal Peças</td>
                    <td class="valor">R$ ${this.formatarMoeda(totalPecas)}</td>
                  </tr>
                  ${
                    desconto > 0
                      ? `
                  <tr>
                    <td>Desconto</td>
                    <td  class="valor-deconto">-R$ ${this.formatarMoeda(
                      desconto
                    )}</td>
                  </tr>
                  `
                      : ""
                  }
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>Total Geral</strong></td>
                    <td class="valor"><strong>R$ ${this.formatarMoeda(
                      totalGeral
                    )}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div class="info-section">
              <h3><span class="icon">📝</span>Informações Adicionais</h3>
              <div class="info-grid">
                <div>
                  <div class="info-item"><strong>Status:</strong> <span class="status ${this.obterClasseStatus(
                    dados.status
                  )}">${dados.status}</span></div>
                </div>
              </div>
            </div>
            
            ${
              dados.observacoes
                ? `
              <div class="observacoes">
                <h4>⚠️ Observações:</h4>
                <p>${dados.observacoes}</p>
              </div>
            `
                : ""
            }
            
            <div class="assinatura">
              <div class="assinatura-item">
                <strong>Assinatura do Cliente</strong>
              </div>
              <div class="assinatura-item">
                <strong>Assinatura do Responsável</strong>
              </div>
            </div>
            
            <div class="footer">
              <p><strong>Documento gerado em ${new Date().toLocaleString(
                "pt-BR"
              )}</strong></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Gerar PDF
  async gerarPDF(
    dados: DadosOrdemServico,
    nomeArquivo: string = "ordem_servico.pdf",
    config: ConfiguracaoPDF = {}
  ): Promise<Uint8Array> {
    if (!this.browser) {
      throw new Error(
        "Browser não foi inicializado. Chame inicializar() primeiro."
      );
    }

    const page: Page = await this.browser.newPage();

    try {
      await page.setContent(this.gerarHTMLOrdemServico(dados), {
        waitUntil: "networkidle0",
      });

      const pdfConfig: PDFOptions = {
        path: nomeArquivo,
        format: config.format || "A4",
        printBackground: config.printBackground !== false,
        margin: {
          top: "8mm",
          right: "8mm",
          bottom: "8mm",
          left: "8mm",
          ...config.margin,
        },
        ...config,
      };

      const pdf = await page.pdf(pdfConfig);
      console.log(`✅ PDF gerado com sucesso: ${nomeArquivo}`);
      return pdf;
    } catch (error) {
      console.error("❌ Erro ao gerar PDF:", error);
      throw error;
    } finally {
      await page.close();
    }
  }

  // Gerar PDF a partir do JSON
  async gerarPDFJson(
    json: OrdemServicoJSON,
    nomeArquivo: string = "ordem_servico.pdf",
    config: ConfiguracaoPDF = {}
  ): Promise<Uint8Array> {
    const dados = this.converterJsonParaOrdemServico(json);
    return this.gerarPDF(dados, nomeArquivo, config);
  }

  // Gerar HTML
  async gerarHTML(
    json: OrdemServicoJSON,
    nomeArquivo: string = "ordem_servico.html"
  ): Promise<string> {
    const dados = this.converterJsonParaOrdemServico(json);
    const html = this.gerarHTMLOrdemServico(dados);
    await fs.writeFile(nomeArquivo, html, "utf8");
    console.log(`✅ HTML gerado com sucesso: ${nomeArquivo}`);
    return html;
  }

  // Método utilitário para gerar OS com auto-inicialização
  static async gerarPDFRapido(
    dados: DadosOrdemServico,
    nomeArquivo?: string,
    config?: ConfiguracaoPDF
  ): Promise<Uint8Array> {
    const gerador = new GeradorOrdemServico();
    try {
      await gerador.inicializar();
      return await gerador.gerarPDF(dados, nomeArquivo, config);
    } finally {
      await gerador.finalizar();
    }
  }

  // Método utilitário para gerar PDF a partir do JSON com auto-inicialização
  static async gerarPDFRapidoJson(
    json: OrdemServicoJSON,
    nomeArquivo?: string,
    config?: ConfiguracaoPDF
  ): Promise<Uint8Array> {
    const gerador = new GeradorOrdemServico();
    try {
      await gerador.inicializar();
      return await gerador.gerarPDFJson(json, nomeArquivo, config);
    } finally {
      await gerador.finalizar();
    }
  }

  // Método utilitário para gerar PDF apenas em memória
  static async gerarPDFBuffer(
    dados: DadosOrdemServico,
    config?: ConfiguracaoPDF
  ): Promise<Uint8Array> {
    const gerador = new GeradorOrdemServico();
    try {
      await gerador.inicializar();

      if (!gerador.browser) {
        throw new Error("Browser não foi inicializado.");
      }

      const page: Page = await gerador.browser.newPage();

      try {
        await page.setContent(gerador.gerarHTMLOrdemServico(dados), {
          waitUntil: "networkidle0",
        });

        const pdfConfig: PDFOptions = {
          format: config?.format || "A4",
          printBackground: config?.printBackground !== false,
          margin: {
            top: "8mm",
            right: "8mm",
            bottom: "8mm",
            left: "8mm",
            ...config?.margin,
          },
          ...config,
        };

        const pdf = await page.pdf(pdfConfig);
        console.log(`✅ PDF gerado em memória com sucesso`);
        return pdf;
      } finally {
        await page.close();
      }
    } finally {
      await gerador.finalizar();
    }
  }

  // Método utilitário para salvar buffer como arquivo
  static async salvarPDFBuffer(
    buffer: Uint8Array,
    nomeArquivo: string
  ): Promise<void> {
    writeFileSync(nomeArquivo, buffer);
    console.log(`✅ PDF salvo como arquivo: ${nomeArquivo}`);
  }
}
