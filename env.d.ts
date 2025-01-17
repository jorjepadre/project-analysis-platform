declare global {
  namespace NodeJS {
    export interface ProcessEnv {
      DATABASE_HOST: string;
      DATABASE_USERNAME: string;
      DATABASE_PASSWORD: string;
      DATABASE_NAME: string;
      DATABASE_URL: string;
    }
  }
}

export {};
