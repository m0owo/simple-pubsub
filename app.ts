// interfaces
interface IEvent {
  type(): string;
  machineId(): string;
}

interface ISubscriber {
  handle(event: IEvent): void;
}

interface IPublishSubscribeService {
  publish(event: IEvent): void;
  subscribe(type: string, handler: ISubscriber): void;
  // unsubscribe ( /* Question 2 - build this feature */ );
}

// implementations
class MachineSaleEvent implements IEvent {
  constructor(
    private readonly _sold: number,
    private readonly _machineId: string
  ) {
    console.log("generating sale event", _sold, _machineId);
  }

  machineId(): string {
    return this._machineId;
  }

  getSoldQuantity(): number {
    return this._sold;
  }

  type(): string {
    return "sale";
  }
}

class MachineRefillEvent implements IEvent {
  constructor(
    private readonly _refill: number,
    private readonly _machineId: string
  ) {
    console.log("generating refill event", _refill, _machineId);
  }

  machineId(): string {
    return this._machineId;
  }

  getRefillQuantity(): number {
    return this._refill;
  }

  type(): string {
    return "refill";
  }
}

class MachineSaleSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor(machines: Machine[]) {
    this.machines = machines;
  }

  handle(event: MachineSaleEvent): void {
    console.log("selling from machine:", event.machineId(), "\n");
    this.machines.find((machine) => {
      return machine.getMachineId() === event.machineId();
    }).stockLevel -= event.getSoldQuantity();

    console.log("stock level of machines:");
    this.machines.forEach((m) =>
      console.log(m.getMachineId(), ":", m.getStockLevel())
    );
  }
}

class MachineRefillSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor(machines: Machine[]) {
    this.machines = machines;
  }

  handle(event: MachineRefillEvent): void {
    console.log("refilling from machine:", event.machineId(), "\n");
    this.machines.find((machine) => {
      return machine.getMachineId() === event.machineId();
    }).stockLevel += event.getRefillQuantity();

    console.log("stock level of machines:");
    this.machines.forEach((m) =>
      console.log(m.getMachineId(), ":", m.getStockLevel())
    );
  }
}

class PublishSubscribeService implements IPublishSubscribeService {
  public subscribers: Record<string, ISubscriber[]> = {};

  constructor(subscribers: Record<string, ISubscriber[]> = {}) {
    this.subscribers = subscribers;
  }

  publish(event: IEvent): void {
    console.log("publish event:", event.type(), event.machineId());
    if (this.subscribers == undefined) {
      console.log("no subscribers");
      return;
    }
    console.log("subscribers found:", this.subscribers[event.type()]?.length);
    this.subscribers[event.type()]?.forEach((handler) => handler.handle(event));
  }

  subscribe(type: string, handler: ISubscriber): void {
    console.log("subscribing event:", type);
    if (!this.subscribers[type]) {
      this.subscribers[type] = [];
    }
    this.subscribers[type].push(handler);
  }
}

// objects
class Machine {
  public stockLevel = 10;
  public id: string;

  constructor(id: string) {
    this.id = id;
  }
  getStockLevel(): number {
    return this.stockLevel;
  }
  getMachineId(): string {
    return this.id;
  }
}

// helpers
const randomMachine = (): string => {
  const random = Math.random() * 3;
  if (random < 1) {
    return "001";
  } else if (random < 2) {
    return "002";
  }
  return "003";
};

const eventGenerator = (): IEvent => {
  const random = Math.random();
  if (random < 0.5) {
    const saleQty = Math.random() < 0.5 ? 1 : 2; // 1 or 2
    return new MachineSaleEvent(saleQty, randomMachine());
  }
  const refillQty = Math.random() < 0.5 ? 3 : 5; // 3 or 5
  return new MachineRefillEvent(refillQty, randomMachine());
};

// program
(async () => {
  // create 3 machines with a quantity of 10 stock
  const machines: Machine[] = [
    new Machine("001"),
    new Machine("002"),
    new Machine("003"),
  ];
  console.log();

  // create a machine sale event subscriber. inject the machines (all subscribers should do this)
  const saleSubscriber = new MachineSaleSubscriber(machines);
  const refillSubscriber = new MachineRefillSubscriber(machines);
  console.log();

  // create the PubSub service
  const pubSubService: IPublishSubscribeService = new PublishSubscribeService();
  pubSubService.subscribe("sale", saleSubscriber);
  pubSubService.subscribe("refill", refillSubscriber);
  console.log();

  // create 5 random events
  const events = [1, 2, 3, 4, 5].map(() => eventGenerator());
  console.log();

  // publish the events
  events.map((event) => pubSubService.publish(event));
  console.log();
})();
