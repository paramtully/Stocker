import "http";

// adds a rawBody property to the IncomingMessage interface
declare module "http" {
    interface IncomingMessage {
      rawBody?: Buffer;
    }
}