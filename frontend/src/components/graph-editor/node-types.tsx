import { NodeTypes } from "reactflow";
import FilterNode from "./nodes/filter";
import DataSourceNode from "./nodes/datasource";
import JoinNode from "./nodes/join";
import RenameNode from "./nodes/rename";
import LinearRegressionNode from "./nodes/linear-regression";

export const nodeTypes: NodeTypes = {
  dataSource: DataSourceNode,
  join: JoinNode,
  filter: FilterNode,
  linearRegression: LinearRegressionNode,
  rename: RenameNode,
};

export const nodeTypeList = [
  { id: "dataSource", name: "Data Source" },
  { id: "join", name: "Join" },
  { id: "filter", name: "Filter" },
  { id: "rename", name: "Rename" },
  { id: "linearRegression", name: "Linear Regression" },
];
