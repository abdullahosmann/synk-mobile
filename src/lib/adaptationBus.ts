type Listener = (payload: any) => void;

class AdaptationBus {
  private listeners: Record<string, Listener[]> = {};

  dispatch(event: string, payload: any) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(listener => listener(payload));
  }

  subscribe(event: string, listener: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
    return () => {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    };
  }
}

// TODO: Wire this to the real backend Adaptation Service dispatch
export const adaptationBus = new AdaptationBus();
