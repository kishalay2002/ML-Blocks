type NodeId = string;
type NodeType = string;

export class GraphNode extends EventTarget {
  private incoming: Set<NodeId>;
  private outgoing: Set<NodeId>;
  private _id: NodeId;
  private _type: NodeType;
  private data: Map<string, any>;

  constructor(id: NodeId, type: NodeType) {
    super();
    this._id = id;
    this._type = type;
    this.incoming = new Set();
    this.outgoing = new Set();
    this.data = new Map();
  }

  get id() {
    return this._id;
  }

  get type() {
    return this._type;
  }

  addIncomingEdge(id: NodeId) {
    this.incoming.add(id);
  }

  addOutgoingEdge(id: NodeId) {
    this.outgoing.add(id);
  }

  removeIncomingEdge(id: NodeId) {
    this.incoming.delete(id);
  }

  removeOutgoingEdge(id: NodeId) {
    this.outgoing.delete(id);
  }

  getIncomingNodes() {
    return this.incoming;
  }

  getOutgoingNodes() {
    return this.outgoing;
  }

  setData(id: string, data: any) {
    this.data.set(id, data);
    this.dispatchEvent(new CustomEvent(id, {
      detail: {
        ...data,
        nodeId: this.id,
        target: this
      }
    }));
  }

  getData(id: string): any {
    return this.data.get(id);
  }
}

type NodesType = Map<NodeId, GraphNode>
type SubscriptionCallback = (node: GraphNode) => void;
type Unsubscribe = () => void;
type SubscriptionList = Map<NodeId, SubscriptionCallback[]>

export class GraphController {
  private nodes: NodesType;
  private subscriptions: SubscriptionList;
  private positionRetreiver: (id: string) => { x: number, y: number };

  constructor() {
    this.nodes = new Map();
    this.subscriptions = new Map();
    this.positionRetreiver = () => ({ x: 0, y: 0 });
  }

  addNode(id: NodeId, type: NodeType, data?: { [key: string]: any }) {
    if (this.nodes.has(id)) {
      throw new Error("node already exists");
    }

    this.nodes.set(id, new GraphNode(id, type));
    if (data) {
      Object.keys(data).forEach((key) => {
        this.nodes.get(id)?.setData(key, data[key]);
      })
    }
  }

  getNode(id: NodeId) {
    const node = this.nodes.get(id);
    if (!node) {
      throw new Error("node not found");
    }
    return node;
  }

  removeNode(id: NodeId) {
    const node = this.nodes.get(id);
    if (!node) {
      throw new Error("node doesn't exist");
    }

    for (const incomingId of node.getIncomingNodes()) {
      const nd = this.nodes.get(incomingId);
      if (!nd) continue;
      nd.removeOutgoingEdge(id);
      this.publish(nd);
    }

    for (const outgoingId of node.getOutgoingNodes()) {
      const nd = this.nodes.get(outgoingId);
      if (!nd) continue;
      nd.removeIncomingEdge(id);
      this.publish(nd);
    }

    this.subscriptions.delete(id);
    this.nodes.delete(id);
  }

  addEdge(source: NodeId, target: NodeId) {
    const sourceNode = this.nodes.get(source)
    if (!sourceNode) {
      throw new Error("source node doesn't exist");
    }

    const targetNode = this.nodes.get(target);
    if (!targetNode) {
      throw new Error("target node doesn't exist");
    }

    sourceNode.addOutgoingEdge(target);
    targetNode.addIncomingEdge(source);

    this.publish(sourceNode);
    this.publish(targetNode);
  }

  removeEdge(source: NodeId, target: NodeId) {
    const sourceNode = this.nodes.get(source)
    if (!sourceNode) {
      throw new Error("source node doesn't exist");
    }

    const targetNode = this.nodes.get(target);
    if (!targetNode) {
      throw new Error("target node doesn't exist");
    }

    sourceNode.removeOutgoingEdge(target);
    targetNode.removeIncomingEdge(source);

    this.publish(sourceNode);
    this.publish(targetNode);
  }

  subscribe(id: NodeId, callback: SubscriptionCallback): Unsubscribe {
    const node = this.nodes.get(id);
    if (!node) {
      throw new Error("Node doesn't exist");
    }

    if (!this.subscriptions.has(id)) {
      this.subscriptions.set(id, [callback]);
    } else {
      this.subscriptions.get(id)?.push(callback);
    }

    this.publish(node);

    return () => {
      const callbacks = this.subscriptions.get(id);
      if (!callbacks) return;
      if (callbacks.length === 1) {
        this.subscriptions.delete(id);
      } else {
        this.subscriptions.set(id, callbacks.filter((cb) => cb !== callback));
      }
    }
  }

  private publish(node: GraphNode) {
    this.subscriptions.get(node.id)?.forEach((callback) => {
      callback(node);
    })
  }

  setPositionRetreiver(func: (id: string) => { x: number, y: number }) {
    this.positionRetreiver = func;
  }

  export() {
    const nodes: any[] = [];
    const edges: Set<{ source: NodeId, target: NodeId, id: string }> = new Set();

    this.nodes.forEach((node, id) => {
      nodes.push({
        id,
        type: node.type,
        data: this.extractNodeData(node),
        position: this.positionRetreiver(id)
      });

      node.getOutgoingNodes().forEach((target) => {
        edges.add({ source: id, target: target, id: id + target });
      })
    });

    return {
      nodes,
      edges: Array.from(edges.values())
    }
  }

  private extractNodeData(node: GraphNode): any {
    let parameters: any[] = [];
    switch (node.type) {
      case "filter":
        parameters = ["key", "value", "operation"];
        break;
      case "dataSource":
        parameters = ["file"]
        break;
      case "rename":
        parameters = ["from", "to"]
        break;
      case "join":
        parameters = ["key"]
        break;
      case "linearRegression":
        parameters = ["x", "y", "hyp/testSize"]
        break;
    }

    return parameters.reduce((val, param) => ({ ...val, [param]: node.getData(param) }), {}) as any;
  }
}