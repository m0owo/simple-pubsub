// interfaces
interface IEvent {
  type(): string;
  machineId(): string;
}

interface ISubscriber {
  handle(event: IEvent): IEvent | undefined;
}

interface IPublishSubscribeService {
  publish(event: IEvent): IEvent | undefined;
  subscribe(type: string, handler: ISubscriber): void;
  unsubscribe(type: string, handler: ISubscriber): void;
}

// implementations
class MachineSaleEvent implements IEvent {
  constructor(
    private readonly _sold: number,
    private readonly _machineId: string
  ) {
    console.log("generating sale event", this._sold, this._machineId);
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
    console.log("generating refill event", this._refill, this._machineId);
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

class LowStockWarningEvent implements IEvent {
  constructor(
    private readonly _stock: number,
    private readonly _machineId: string
  ) {
    // console.log(
    //   "stock too low warning generated: ",
    //   this._stock,
    //   this._machineId
    // );
  }

  machineId(): string {
    return this._machineId;
  }

  stock(): number {
    return this._stock;
  }

  type(): string {
    return "low stock";
  }
}

class StockLevelOkEvent implements IEvent {
  constructor(
    private readonly _stock: number,
    private readonly _machineId: string
  ) {
    // console.log("ok stock warning generated: ", this._stock, this._machineId);
  }

  machineId(): string {
    return this._machineId;
  }

  stock(): number {
    return this._stock;
  }

  type(): string {
    return "ok stock";
  }
}

class MachineSaleSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor(machines: Machine[]) {
    this.machines = machines;
  }

  handle(event: MachineSaleEvent): LowStockWarningEvent | undefined {
    console.log(
      `selling ${event.getSoldQuantity()} from machine ${event.machineId()}`
    );
    const machine = this.machines.find((machine) => {
      return machine.id === event.machineId();
    });
    if (machine.stockLevel < 3) {
      machine.stockLevel -= event.getSoldQuantity();
      console.log("stock level of machines:");
      this.machines.forEach((m) => console.log(m.id, ":", m.stockLevel));
      return;
    }
    machine.stockLevel -= event.getSoldQuantity();

    console.log("stock level of machines:");
    this.machines.forEach((m) => console.log(m.id, ":", m.stockLevel));

    if (machine.stockLevel < 3) {
      return new LowStockWarningEvent(machine.stockLevel, event.machineId());
    }
  }
}

class MachineRefillSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor(machines: Machine[]) {
    this.machines = machines;
  }

  handle(event: MachineRefillEvent): StockLevelOkEvent | undefined {
    console.log(
      `refilling ${event.getRefillQuantity()} to machine ${event.machineId()}`
    );
    const machine = this.machines.find((machine) => {
      return machine.id === event.machineId();
    });

    if (machine.stockLevel >= 3) {
      machine.stockLevel += event.getRefillQuantity();
      console.log("stock level of machines:");
      this.machines.forEach((m) => console.log(m.id, ":", m.stockLevel));
      return;
    }
    machine.stockLevel += event.getRefillQuantity();

    console.log("stock level of machines:");
    this.machines.forEach((m) => console.log(m.id, ":", m.stockLevel));

    if (machine.stockLevel >= 3) {
      return new StockLevelOkEvent(machine.stockLevel, event.machineId());
    }
  }
}

class StockWarningSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor(machines: Machine[]) {
    this.machines = machines;
  }

  handle(event: LowStockWarningEvent): undefined {
    console.log(
      `***** Stock Levels Too Low Warning (Machine: ${event.machineId()}) *****`
    );
    // this.machines.find((machine) => {
    //   return machine.id === event.machineId();
    // }).stockLevel += 3;

    // console.log("stock level of machines:");
    // this.machines.forEach((m) => console.log(m.id, ":", m.stockLevel));
  }
}

class StockOkSubscriber implements ISubscriber {
  public machines: Machine[];

  constructor(machines: Machine[]) {
    this.machines = machines;
  }

  handle(event: StockLevelOkEvent): undefined {
    console.log(`***** Stock Levels OK (Machine: ${event.machineId()}) *****`);
    // this.machines.find((machine) => {
    //   return machine.id === event.machineId();
    // }).stockLevel += 3;

    // console.log("stock level of machines:");
    // this.machines.forEach((m) => console.log(m.id, ":", m.stockLevel));
  }
}

class PublishSubscribeService implements IPublishSubscribeService {
  public subscribers: Record<string, ISubscriber[]> = {};

  constructor(subscribers: Record<string, ISubscriber[]> = {}) {
    this.subscribers = subscribers;
  }

  publish(event: IEvent): IEvent | undefined {
    const handlers = this.subscribers[event.type()];
    console.log("subscribers found: ", handlers.length);
    if (!handlers) return;

    for (const handler of handlers) {
      const warning = handler.handle(event);
      if (warning !== undefined) {
        return warning;
      }
    }

    return undefined;
  }

  subscribe(type: string, handler: ISubscriber): void {
    console.log("subscribing event:", type);
    if (!this.subscribers[type]) {
      this.subscribers[type] = [];
    }
    this.subscribers[type].push(handler);
  }

  unsubscribe(type: string, handler: ISubscriber): void {
    console.log("unsubscribing from event", type);
    if (!this.subscribers[type]) {
      return;
    }
    this.subscribers[type] = this.subscribers[type].filter((subscriber) => {
      return subscriber !== handler;
    });
  }
}

// objects
class Machine {
  public stockLevel = 10;
  public id: string;

  constructor(id: string) {
    this.id = id;
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

  // create a machine sale event subscriber. inject the machines (all subscribers should do this)
  const saleSubscriber = new MachineSaleSubscriber(machines);
  const refillSubscriber = new MachineRefillSubscriber(machines);
  const warningSubscriber = new StockWarningSubscriber(machines);
  const okSubscriber = new StockOkSubscriber(machines);
  console.log();

  // create the PubSub service
  const pubSubService: IPublishSubscribeService = new PublishSubscribeService();
  console.log(
    "-------------------- Subscribing to Events --------------------"
  );
  pubSubService.subscribe("sale", saleSubscriber);
  pubSubService.subscribe("refill", refillSubscriber);
  pubSubService.subscribe("low stock", warningSubscriber);
  pubSubService.subscribe("ok stock", okSubscriber);

  // create 5 random events
  console.log(
    "-------------------- Generating Random Events --------------------"
  );
  let events = [1, 2, 3, 4, 5].map(() => eventGenerator());

  // publish the events
  // console.log("-------------------- Publishing Events --------------------");
  // events.map((event) => pubSubService.publish(event));
  console.log("-------------------- Publishing Events --------------------");
  for (const event of events) {
    const result = pubSubService.publish(event);
    if (result) {
      // pubSubService.publish(result);
      events.push(result);
    }
  }

  // unsubscribing
  console.log("-------------------- Unsubscribing --------------------");
  pubSubService.unsubscribe("sale", saleSubscriber);

  // create 5 random events
  console.log(
    "-------------------- Generating Random Events --------------------"
  );
  events = [1, 2, 3, 4, 5].map(() => eventGenerator());

  // publish the events
  console.log("-------------------- Publishing Events --------------------");
  for (const event of events) {
    const result = pubSubService.publish(event);
    if (result) {
      // pubSubService.publish(result);
      events.push(result);
    }
  }
})();
