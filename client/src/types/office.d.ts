declare namespace Office {
  enum HostType {
    Word = "Word"
  }

  interface InitializationInfo {
    host: HostType;
  }

  function onReady(callback: (info: InitializationInfo) => void): void;
}

declare namespace Word {
  interface Range {
    start: number;
    end: number;
    text: string;
    font: {
      highlightColor: string;
    };
    load(properties: string): void;
  }

  interface Selection {
    text: string;
    getRange(): Range;
    load(properties: string): void;
  }

  interface Document {
    getSelection(): Selection;
  }

  interface RequestContext {
    document: Document;
    sync(): Promise<void>;
  }

  function run<T>(callback: (context: RequestContext) => Promise<T>): Promise<T>;
}
