from collections import defaultdict, deque


class NodeScheduler:
    def __init__(self, nodes: [dict], edges: [dict], source_node_id: str):
        self.graph = defaultdict(list)
        self.queue = []
        self.nodes = nodes
        self.edges = edges
        self.source_node_id = source_node_id
        self.V = len(nodes)
        self.visited = [False] * self.V
        # maps numbers to nodes
        self.num_to_node_id_map = {}
        # maps nodes to numbers
        self.node_to_num_map = {}
        # maps nodes to details on nodes. so that we can get node data at O(1) complexity
        self.node_details = {}
        self.dependencies = {i: [] for i in range(self.V)}

        for i, node in enumerate(nodes):
            self.num_to_node_id_map[i] = node["id"]
            self.node_to_num_map[node["id"]] = i

        for e in edges:
            self.add_edge(
                self.node_to_num_map[e["source"]], self.node_to_num_map[e["target"]]
            )

            self.dependencies[self.node_to_num_map[e["target"]]].append(
                self.node_to_num_map[e["source"]]
            )

    def add_edge(self, u, v):
        self.graph[u].append(v)

    def get_execution_order(self):
        """generate node to execute in order"""
        st = []
        order = deque()
        st.append(self.node_to_num_map[self.source_node_id])

        while len(st) > 0:
            node = st.pop()
            self.visited[node] = True
            order.appendleft(node)
            for deps in self.dependencies[node]:
                if not self.visited[deps]:
                    st.append(deps)

        return list(order)
