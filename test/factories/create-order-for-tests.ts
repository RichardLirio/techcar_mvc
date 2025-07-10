import { prisma } from "@/lib/database";

export async function CreateOrderForTests(status?: "COMPLETED") {
  const client = await prisma.client.create({
    data: {
      name: "JOHN DOE CLIENT",
      cpfCnpj: "47022391041",
      phone: "27997876754",
      email: "johndoe@example.com",
      address: "Rua nova, numero 2, Vitoria-ES",
    },
  });

  const vehicle = await prisma.vehicle.create({
    data: {
      plate: "PPW1020",
      model: "ARGO",
      brand: "FIAT",
      kilometers: 45000,
      year: 2018,
      clientId: client.id,
    },
  });

  const part = await prisma.part.create({
    data: {
      name: "FILTRO COMBUSTIVEL",
      quantity: 10,
      description: "FILTRO COMBUSTIVEL DO ARGO 2018",
      unitPrice: 50.2,
    },
  });
  const services = [
    { description: "troca de oleo", price: 30 },
    { description: "troca de filtro", price: 40 },
  ];

  const items = [
    { partId: part.id, quantity: 2, unitPrice: Number(part.unitPrice) },
  ];

  const order = await prisma.$transaction(async (tx) => {
    // Criar ordem
    const newOrder = await tx.order.create({
      data: {
        clientId: client.id,
        vehicleId: vehicle.id,
        description: "MANUTENÇÃO CORRETIVA",
        kilometers: 45000,
        discount: 0,
        totalValue: 170.4,
        status: status ? status : "IN_PROGRESS",
      },
    });

    // Criar serviços
    if (services.length > 0) {
      await tx.service.createMany({
        data: services.map((service) => ({
          orderId: newOrder.id,
          description: service.description,
          price: service.price,
        })),
      });
    }

    // Criar itens e atualizar estoque
    if (items.length > 0) {
      await tx.orderItem.createMany({
        data: items.map((item) => ({
          orderId: newOrder.id,
          partId: item.partId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      });

      // Atualizar estoque
      for (const item of items) {
        await tx.part.update({
          where: { id: item.partId },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    return newOrder;
  });

  return order;
}
