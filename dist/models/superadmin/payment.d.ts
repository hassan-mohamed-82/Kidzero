export declare const payment: import("drizzle-orm/mysql-core").MySqlTableWithColumns<{
    name: "payments";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "id";
            tableName: "payments";
            dataType: "string";
            columnType: "MySqlChar";
            data: string;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 36;
        }>;
        planId: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "plan_id";
            tableName: "payments";
            dataType: "string";
            columnType: "MySqlChar";
            data: string;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: 36;
        }>;
        amount: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "amount";
            tableName: "payments";
            dataType: "number";
            columnType: "MySqlDouble";
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        rejectedReason: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "rejected_reason";
            tableName: "payments";
            dataType: "string";
            columnType: "MySqlVarChar";
            data: string;
            driverParam: string | number;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        status: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "status";
            tableName: "payments";
            dataType: "string";
            columnType: "MySqlEnumColumn";
            data: "pending" | "completed" | "rejected";
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: ["pending", "completed", "rejected"];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "mysql";
}>;
