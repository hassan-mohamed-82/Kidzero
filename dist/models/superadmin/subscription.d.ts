export declare const subscriptions: import("drizzle-orm/mysql-core").MySqlTableWithColumns<{
    name: "subscriptions";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "id";
            tableName: "subscriptions";
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
            tableName: "subscriptions";
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
        startDate: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "start_date";
            tableName: "subscriptions";
            dataType: "date";
            columnType: "MySqlTimestamp";
            data: Date;
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
        endDate: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "end_date";
            tableName: "subscriptions";
            dataType: "date";
            columnType: "MySqlTimestamp";
            data: Date;
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
        paymentId: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "payment_id";
            tableName: "subscriptions";
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
        isActive: import("drizzle-orm/mysql-core").MySqlColumn<{
            name: "is_active";
            tableName: "subscriptions";
            dataType: "boolean";
            columnType: "MySqlBoolean";
            data: boolean;
            driverParam: number | boolean;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
    };
    dialect: "mysql";
}>;
