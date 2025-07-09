// Tipo base para respostas da API

// Tipo para resposta de erro
export interface ErrorResponse {
  success: false;
  message: string;
  error: object | string;
  statusCode: number;
}

// Tipo para resposta de sucesso
export interface SuccessResponse<T = unknown> {
  success: true;
  message: string;
  data?: T;
}
