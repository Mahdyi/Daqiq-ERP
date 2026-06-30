export interface HttpActivityHandle {
  close(): void;
}

export interface HttpActivityPort {
  begin(): HttpActivityHandle;
}
