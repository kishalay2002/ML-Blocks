export type TProject = {
    id: string;
    name: string;
    kernel_id: string;
    kernel_url: string;
    kernel_status: string;
    created_at: Date,
    updated_at: Date,
    graph?: {
        nodes: any,
        edges: any
    };
}

export type TDataSourceSchema = {
    name: string;
    type: string;
}[];

export type TFile = {
    name: string;
    last_modified: number;
    last_accessed: number;
    size: number;
    mode: string;
    kind: string;
    schema: TDataSourceSchema;
    viz: string[]
}