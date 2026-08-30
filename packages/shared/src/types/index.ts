export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiResponse<TData> =
  | {
      success: true;
      data: TData;
    }
  | {
      success: false;
      error: ApiError;
    };
