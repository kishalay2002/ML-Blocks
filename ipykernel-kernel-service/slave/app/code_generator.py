from typing import Dict, Any, List

from graph_processor import NodeScheduler


class CodeGenerator:
    def __init__(self, node_scheduler: NodeScheduler):
        self.func_to_output_map = {
            "dataSource": ["df"],
            "join": ["df_merged"],
            "rename": ["df_rename"],
            "filter": ["df_filter"],
            "linearRegression": ["lin_reg"]
        }
        self.node_to_var_map = {}
        self.node_scheduler = node_scheduler

    def generate_code(self, node: dict) -> str:
        code: str = ""
        node_id = node["id"]
        if node["type"] == "dataSource":
            var_name = f'{self.func_to_output_map["dataSource"][0]}_{self.node_scheduler.node_to_num_map[node_id]}'
            filename = node["data"]["file"]

            # call the import json function
            code += f"{var_name}, status = preprocessing.DataSource.load('{filename}')\n"
            code += f"print({var_name}.info())\n"

            if node_id in self.node_to_var_map:
                self.node_to_var_map[node_id].append(var_name)
            else:
                self.node_to_var_map[node_id] = [var_name]

        if node["type"] == "rename":
            var_name = self.func_to_output_map["rename"][
                           0] + f"_{self.node_scheduler.dependencies[self.node_scheduler.node_to_num_map[node_id]][0]}"
            initial_col_name = node["data"]["from"]
            fin_col_name = node["data"]["to"]

            data_frame = self.node_to_var_map[
                self.node_scheduler.num_to_node_id_map[
                    self.node_scheduler.dependencies[self.node_scheduler.node_to_num_map[node_id]][0]]][
                0]
            code += f"{var_name},status=preprocessing.DataModification.rename_col({data_frame},'{initial_col_name}','{fin_col_name}')\n"
            code += f"print({var_name}.info())\n"

            if node_id in self.node_to_var_map:
                if var_name not in self.node_to_var_map[node_id]:
                    self.node_to_var_map[node_id].append(var_name)
            else:
                self.node_to_var_map[node_id] = [var_name]

        if node["type"] == "join":
            data_frames_list = ""
            for i in self.node_scheduler.dependencies[self.node_scheduler.node_to_num_map[node_id]]:
                data_frames_list += str(self.node_to_var_map[self.node_scheduler.num_to_node_id_map[i]][0]) + ","

            data_frames_list = data_frames_list[:-1]

            key = node["data"]["key"]
            var_name = self.func_to_output_map['join'][0]
            for deps in self.node_scheduler.dependencies[self.node_scheduler.node_to_num_map[node_id]]:
                var_name += f"_{deps}"

            code += f"{var_name},status=preprocessing.DataModification.join_dataframe([{data_frames_list}],'{key}')\n"
            code += f"print({var_name}.info())\n"

            if node_id in self.node_to_var_map:
                if var_name not in self.node_to_var_map[node_id]:
                    self.node_to_var_map[node_id].append(var_name)
            else:
                self.node_to_var_map[node_id] = [var_name]

        if node["type"] == "filter":
            var_name = self.func_to_output_map["filter"][
                           0] + f"_{self.node_scheduler.dependencies[self.node_scheduler.node_to_num_map[node_id]][0]}"
            operation = node["data"]["operation"]
            key = node["data"]["key"]
            value = node["data"]["value"]

            data_frame = self.node_to_var_map[
                self.node_scheduler.num_to_node_id_map[
                    self.node_scheduler.dependencies[self.node_scheduler.node_to_num_map[node_id]][0]]][
                0]

            # currently works with int values only. need to update
            if operation == "less_than":
                code = f"{var_name},status=preprocessing.DataModification.filter_less_than({data_frame},'{key}',{value})\n"

            if operation == "equals":
                code = f"{var_name},status=preprocessing.DataModification.filter_equal({data_frame},'{key}','{value}')\n"

            if operation == "greater_than":
                code = f"{var_name},status=preprocessing.DataModification.filter_greater_than({data_frame},'{key}',{value})\n"
            code += f"print({var_name}.info())\n"
            if node_id in self.node_to_var_map:
                if var_name not in self.node_to_var_map[node_id]:
                    self.node_to_var_map[node_id].append(var_name)
            else:
                self.node_to_var_map[node_id] = [var_name]

        if node["type"] == "linearRegression":
            df_var = self.node_to_var_map[
                self.node_scheduler.num_to_node_id_map[
                    self.node_scheduler.dependencies[self.node_scheduler.node_to_num_map[node_id]][0]]][
                0]
            var_name = self.func_to_output_map["linearRegression"][
                           0] + f"_{self.node_scheduler.dependencies[self.node_scheduler.node_to_num_map[node_id]][0]}"
            x = node['data']['x']
            y = node['data']['y']
            test_size = node['data']['hyp/testSize'] / 100.0

            code += f"{var_name} = preprocessing.MachineLearningAlgorithms.linear_regression({df_var}, {str(x)}, \"{y}\", {test_size})\n"
            code += f"print({var_name}[1])\n"

            if node_id in self.node_to_var_map:
                if var_name not in self.node_to_var_map[node_id]:
                    self.node_to_var_map[node_id].append(var_name)
            else:
                self.node_to_var_map[node_id] = [var_name]

        return code

    def get_inference_code(self, source_node_id, inputs: List[Any]):
        var_name = self.func_to_output_map["linearRegression"][
                       0] + f"_{self.node_scheduler.dependencies[self.node_scheduler.node_to_num_map[source_node_id]][0]}"

        code = f"prediction = preprocessing.Inference.infer({var_name}, {str(inputs)})\n"
        code += f"print(prediction)"
        return code
