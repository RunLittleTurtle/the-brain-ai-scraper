
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Build
 * 
 */
export type Build = $Result.DefaultSelection<Prisma.$BuildPayload>
/**
 * Model Run
 * 
 */
export type Run = $Result.DefaultSelection<Prisma.$RunPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const BuildStatus: {
  PENDING_ANALYSIS: 'PENDING_ANALYSIS',
  GENERATING_SAMPLES: 'GENERATING_SAMPLES',
  PENDING_USER_FEEDBACK: 'PENDING_USER_FEEDBACK',
  CONFIRMED: 'CONFIRMED',
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  FAILED: 'FAILED',
  PROCESSING_FEEDBACK: 'PROCESSING_FEEDBACK'
};

export type BuildStatus = (typeof BuildStatus)[keyof typeof BuildStatus]


export const RunStatus: {
  PENDING: 'PENDING',
  RUNNING: 'RUNNING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED'
};

export type RunStatus = (typeof RunStatus)[keyof typeof RunStatus]

}

export type BuildStatus = $Enums.BuildStatus

export const BuildStatus: typeof $Enums.BuildStatus

export type RunStatus = $Enums.RunStatus

export const RunStatus: typeof $Enums.RunStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Builds
 * const builds = await prisma.build.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Builds
   * const builds = await prisma.build.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.build`: Exposes CRUD operations for the **Build** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Builds
    * const builds = await prisma.build.findMany()
    * ```
    */
  get build(): Prisma.BuildDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.run`: Exposes CRUD operations for the **Run** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Runs
    * const runs = await prisma.run.findMany()
    * ```
    */
  get run(): Prisma.RunDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.6.0
   * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Build: 'Build',
    Run: 'Run'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "build" | "run"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Build: {
        payload: Prisma.$BuildPayload<ExtArgs>
        fields: Prisma.BuildFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BuildFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuildPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BuildFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuildPayload>
          }
          findFirst: {
            args: Prisma.BuildFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuildPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BuildFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuildPayload>
          }
          findMany: {
            args: Prisma.BuildFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuildPayload>[]
          }
          create: {
            args: Prisma.BuildCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuildPayload>
          }
          createMany: {
            args: Prisma.BuildCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BuildCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuildPayload>[]
          }
          delete: {
            args: Prisma.BuildDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuildPayload>
          }
          update: {
            args: Prisma.BuildUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuildPayload>
          }
          deleteMany: {
            args: Prisma.BuildDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BuildUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BuildUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuildPayload>[]
          }
          upsert: {
            args: Prisma.BuildUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BuildPayload>
          }
          aggregate: {
            args: Prisma.BuildAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBuild>
          }
          groupBy: {
            args: Prisma.BuildGroupByArgs<ExtArgs>
            result: $Utils.Optional<BuildGroupByOutputType>[]
          }
          count: {
            args: Prisma.BuildCountArgs<ExtArgs>
            result: $Utils.Optional<BuildCountAggregateOutputType> | number
          }
        }
      }
      Run: {
        payload: Prisma.$RunPayload<ExtArgs>
        fields: Prisma.RunFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RunFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RunPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RunFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RunPayload>
          }
          findFirst: {
            args: Prisma.RunFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RunPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RunFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RunPayload>
          }
          findMany: {
            args: Prisma.RunFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RunPayload>[]
          }
          create: {
            args: Prisma.RunCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RunPayload>
          }
          createMany: {
            args: Prisma.RunCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RunCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RunPayload>[]
          }
          delete: {
            args: Prisma.RunDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RunPayload>
          }
          update: {
            args: Prisma.RunUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RunPayload>
          }
          deleteMany: {
            args: Prisma.RunDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RunUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RunUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RunPayload>[]
          }
          upsert: {
            args: Prisma.RunUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RunPayload>
          }
          aggregate: {
            args: Prisma.RunAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRun>
          }
          groupBy: {
            args: Prisma.RunGroupByArgs<ExtArgs>
            result: $Utils.Optional<RunGroupByOutputType>[]
          }
          count: {
            args: Prisma.RunCountArgs<ExtArgs>
            result: $Utils.Optional<RunCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    build?: BuildOmit
    run?: RunOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type BuildCountOutputType
   */

  export type BuildCountOutputType = {
    runs: number
  }

  export type BuildCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    runs?: boolean | BuildCountOutputTypeCountRunsArgs
  }

  // Custom InputTypes
  /**
   * BuildCountOutputType without action
   */
  export type BuildCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BuildCountOutputType
     */
    select?: BuildCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * BuildCountOutputType without action
   */
  export type BuildCountOutputTypeCountRunsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RunWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Build
   */

  export type AggregateBuild = {
    _count: BuildCountAggregateOutputType | null
    _min: BuildMinAggregateOutputType | null
    _max: BuildMaxAggregateOutputType | null
  }

  export type BuildMinAggregateOutputType = {
    id: string | null
    userId: string | null
    targetUrls: string | null
    userObjective: string | null
    status: $Enums.BuildStatus | null
    error: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BuildMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    targetUrls: string | null
    userObjective: string | null
    status: $Enums.BuildStatus | null
    error: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type BuildCountAggregateOutputType = {
    id: number
    userId: number
    targetUrls: number
    userObjective: number
    status: number
    error: number
    initialPackageJson: number
    sampleResultsJson: number
    finalConfigurationJson: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type BuildMinAggregateInputType = {
    id?: true
    userId?: true
    targetUrls?: true
    userObjective?: true
    status?: true
    error?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BuildMaxAggregateInputType = {
    id?: true
    userId?: true
    targetUrls?: true
    userObjective?: true
    status?: true
    error?: true
    createdAt?: true
    updatedAt?: true
  }

  export type BuildCountAggregateInputType = {
    id?: true
    userId?: true
    targetUrls?: true
    userObjective?: true
    status?: true
    error?: true
    initialPackageJson?: true
    sampleResultsJson?: true
    finalConfigurationJson?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type BuildAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Build to aggregate.
     */
    where?: BuildWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Builds to fetch.
     */
    orderBy?: BuildOrderByWithRelationInput | BuildOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BuildWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Builds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Builds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Builds
    **/
    _count?: true | BuildCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BuildMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BuildMaxAggregateInputType
  }

  export type GetBuildAggregateType<T extends BuildAggregateArgs> = {
        [P in keyof T & keyof AggregateBuild]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBuild[P]>
      : GetScalarType<T[P], AggregateBuild[P]>
  }




  export type BuildGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BuildWhereInput
    orderBy?: BuildOrderByWithAggregationInput | BuildOrderByWithAggregationInput[]
    by: BuildScalarFieldEnum[] | BuildScalarFieldEnum
    having?: BuildScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BuildCountAggregateInputType | true
    _min?: BuildMinAggregateInputType
    _max?: BuildMaxAggregateInputType
  }

  export type BuildGroupByOutputType = {
    id: string
    userId: string | null
    targetUrls: string
    userObjective: string
    status: $Enums.BuildStatus
    error: string | null
    initialPackageJson: JsonValue | null
    sampleResultsJson: JsonValue | null
    finalConfigurationJson: JsonValue | null
    createdAt: Date
    updatedAt: Date
    _count: BuildCountAggregateOutputType | null
    _min: BuildMinAggregateOutputType | null
    _max: BuildMaxAggregateOutputType | null
  }

  type GetBuildGroupByPayload<T extends BuildGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BuildGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BuildGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BuildGroupByOutputType[P]>
            : GetScalarType<T[P], BuildGroupByOutputType[P]>
        }
      >
    >


  export type BuildSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    targetUrls?: boolean
    userObjective?: boolean
    status?: boolean
    error?: boolean
    initialPackageJson?: boolean
    sampleResultsJson?: boolean
    finalConfigurationJson?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    runs?: boolean | Build$runsArgs<ExtArgs>
    _count?: boolean | BuildCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["build"]>

  export type BuildSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    targetUrls?: boolean
    userObjective?: boolean
    status?: boolean
    error?: boolean
    initialPackageJson?: boolean
    sampleResultsJson?: boolean
    finalConfigurationJson?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["build"]>

  export type BuildSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    targetUrls?: boolean
    userObjective?: boolean
    status?: boolean
    error?: boolean
    initialPackageJson?: boolean
    sampleResultsJson?: boolean
    finalConfigurationJson?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["build"]>

  export type BuildSelectScalar = {
    id?: boolean
    userId?: boolean
    targetUrls?: boolean
    userObjective?: boolean
    status?: boolean
    error?: boolean
    initialPackageJson?: boolean
    sampleResultsJson?: boolean
    finalConfigurationJson?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type BuildOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "targetUrls" | "userObjective" | "status" | "error" | "initialPackageJson" | "sampleResultsJson" | "finalConfigurationJson" | "createdAt" | "updatedAt", ExtArgs["result"]["build"]>
  export type BuildInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    runs?: boolean | Build$runsArgs<ExtArgs>
    _count?: boolean | BuildCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type BuildIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type BuildIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $BuildPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Build"
    objects: {
      runs: Prisma.$RunPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string | null
      targetUrls: string
      userObjective: string
      status: $Enums.BuildStatus
      error: string | null
      initialPackageJson: Prisma.JsonValue | null
      sampleResultsJson: Prisma.JsonValue | null
      finalConfigurationJson: Prisma.JsonValue | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["build"]>
    composites: {}
  }

  type BuildGetPayload<S extends boolean | null | undefined | BuildDefaultArgs> = $Result.GetResult<Prisma.$BuildPayload, S>

  type BuildCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BuildFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BuildCountAggregateInputType | true
    }

  export interface BuildDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Build'], meta: { name: 'Build' } }
    /**
     * Find zero or one Build that matches the filter.
     * @param {BuildFindUniqueArgs} args - Arguments to find a Build
     * @example
     * // Get one Build
     * const build = await prisma.build.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BuildFindUniqueArgs>(args: SelectSubset<T, BuildFindUniqueArgs<ExtArgs>>): Prisma__BuildClient<$Result.GetResult<Prisma.$BuildPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Build that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BuildFindUniqueOrThrowArgs} args - Arguments to find a Build
     * @example
     * // Get one Build
     * const build = await prisma.build.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BuildFindUniqueOrThrowArgs>(args: SelectSubset<T, BuildFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BuildClient<$Result.GetResult<Prisma.$BuildPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Build that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BuildFindFirstArgs} args - Arguments to find a Build
     * @example
     * // Get one Build
     * const build = await prisma.build.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BuildFindFirstArgs>(args?: SelectSubset<T, BuildFindFirstArgs<ExtArgs>>): Prisma__BuildClient<$Result.GetResult<Prisma.$BuildPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Build that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BuildFindFirstOrThrowArgs} args - Arguments to find a Build
     * @example
     * // Get one Build
     * const build = await prisma.build.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BuildFindFirstOrThrowArgs>(args?: SelectSubset<T, BuildFindFirstOrThrowArgs<ExtArgs>>): Prisma__BuildClient<$Result.GetResult<Prisma.$BuildPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Builds that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BuildFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Builds
     * const builds = await prisma.build.findMany()
     * 
     * // Get first 10 Builds
     * const builds = await prisma.build.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const buildWithIdOnly = await prisma.build.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BuildFindManyArgs>(args?: SelectSubset<T, BuildFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BuildPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Build.
     * @param {BuildCreateArgs} args - Arguments to create a Build.
     * @example
     * // Create one Build
     * const Build = await prisma.build.create({
     *   data: {
     *     // ... data to create a Build
     *   }
     * })
     * 
     */
    create<T extends BuildCreateArgs>(args: SelectSubset<T, BuildCreateArgs<ExtArgs>>): Prisma__BuildClient<$Result.GetResult<Prisma.$BuildPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Builds.
     * @param {BuildCreateManyArgs} args - Arguments to create many Builds.
     * @example
     * // Create many Builds
     * const build = await prisma.build.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BuildCreateManyArgs>(args?: SelectSubset<T, BuildCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Builds and returns the data saved in the database.
     * @param {BuildCreateManyAndReturnArgs} args - Arguments to create many Builds.
     * @example
     * // Create many Builds
     * const build = await prisma.build.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Builds and only return the `id`
     * const buildWithIdOnly = await prisma.build.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BuildCreateManyAndReturnArgs>(args?: SelectSubset<T, BuildCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BuildPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Build.
     * @param {BuildDeleteArgs} args - Arguments to delete one Build.
     * @example
     * // Delete one Build
     * const Build = await prisma.build.delete({
     *   where: {
     *     // ... filter to delete one Build
     *   }
     * })
     * 
     */
    delete<T extends BuildDeleteArgs>(args: SelectSubset<T, BuildDeleteArgs<ExtArgs>>): Prisma__BuildClient<$Result.GetResult<Prisma.$BuildPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Build.
     * @param {BuildUpdateArgs} args - Arguments to update one Build.
     * @example
     * // Update one Build
     * const build = await prisma.build.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BuildUpdateArgs>(args: SelectSubset<T, BuildUpdateArgs<ExtArgs>>): Prisma__BuildClient<$Result.GetResult<Prisma.$BuildPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Builds.
     * @param {BuildDeleteManyArgs} args - Arguments to filter Builds to delete.
     * @example
     * // Delete a few Builds
     * const { count } = await prisma.build.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BuildDeleteManyArgs>(args?: SelectSubset<T, BuildDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Builds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BuildUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Builds
     * const build = await prisma.build.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BuildUpdateManyArgs>(args: SelectSubset<T, BuildUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Builds and returns the data updated in the database.
     * @param {BuildUpdateManyAndReturnArgs} args - Arguments to update many Builds.
     * @example
     * // Update many Builds
     * const build = await prisma.build.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Builds and only return the `id`
     * const buildWithIdOnly = await prisma.build.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BuildUpdateManyAndReturnArgs>(args: SelectSubset<T, BuildUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BuildPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Build.
     * @param {BuildUpsertArgs} args - Arguments to update or create a Build.
     * @example
     * // Update or create a Build
     * const build = await prisma.build.upsert({
     *   create: {
     *     // ... data to create a Build
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Build we want to update
     *   }
     * })
     */
    upsert<T extends BuildUpsertArgs>(args: SelectSubset<T, BuildUpsertArgs<ExtArgs>>): Prisma__BuildClient<$Result.GetResult<Prisma.$BuildPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Builds.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BuildCountArgs} args - Arguments to filter Builds to count.
     * @example
     * // Count the number of Builds
     * const count = await prisma.build.count({
     *   where: {
     *     // ... the filter for the Builds we want to count
     *   }
     * })
    **/
    count<T extends BuildCountArgs>(
      args?: Subset<T, BuildCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BuildCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Build.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BuildAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BuildAggregateArgs>(args: Subset<T, BuildAggregateArgs>): Prisma.PrismaPromise<GetBuildAggregateType<T>>

    /**
     * Group by Build.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BuildGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BuildGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BuildGroupByArgs['orderBy'] }
        : { orderBy?: BuildGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BuildGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBuildGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Build model
   */
  readonly fields: BuildFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Build.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BuildClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    runs<T extends Build$runsArgs<ExtArgs> = {}>(args?: Subset<T, Build$runsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Build model
   */
  interface BuildFieldRefs {
    readonly id: FieldRef<"Build", 'String'>
    readonly userId: FieldRef<"Build", 'String'>
    readonly targetUrls: FieldRef<"Build", 'String'>
    readonly userObjective: FieldRef<"Build", 'String'>
    readonly status: FieldRef<"Build", 'BuildStatus'>
    readonly error: FieldRef<"Build", 'String'>
    readonly initialPackageJson: FieldRef<"Build", 'Json'>
    readonly sampleResultsJson: FieldRef<"Build", 'Json'>
    readonly finalConfigurationJson: FieldRef<"Build", 'Json'>
    readonly createdAt: FieldRef<"Build", 'DateTime'>
    readonly updatedAt: FieldRef<"Build", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Build findUnique
   */
  export type BuildFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Build
     */
    select?: BuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Build
     */
    omit?: BuildOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuildInclude<ExtArgs> | null
    /**
     * Filter, which Build to fetch.
     */
    where: BuildWhereUniqueInput
  }

  /**
   * Build findUniqueOrThrow
   */
  export type BuildFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Build
     */
    select?: BuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Build
     */
    omit?: BuildOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuildInclude<ExtArgs> | null
    /**
     * Filter, which Build to fetch.
     */
    where: BuildWhereUniqueInput
  }

  /**
   * Build findFirst
   */
  export type BuildFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Build
     */
    select?: BuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Build
     */
    omit?: BuildOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuildInclude<ExtArgs> | null
    /**
     * Filter, which Build to fetch.
     */
    where?: BuildWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Builds to fetch.
     */
    orderBy?: BuildOrderByWithRelationInput | BuildOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Builds.
     */
    cursor?: BuildWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Builds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Builds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Builds.
     */
    distinct?: BuildScalarFieldEnum | BuildScalarFieldEnum[]
  }

  /**
   * Build findFirstOrThrow
   */
  export type BuildFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Build
     */
    select?: BuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Build
     */
    omit?: BuildOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuildInclude<ExtArgs> | null
    /**
     * Filter, which Build to fetch.
     */
    where?: BuildWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Builds to fetch.
     */
    orderBy?: BuildOrderByWithRelationInput | BuildOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Builds.
     */
    cursor?: BuildWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Builds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Builds.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Builds.
     */
    distinct?: BuildScalarFieldEnum | BuildScalarFieldEnum[]
  }

  /**
   * Build findMany
   */
  export type BuildFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Build
     */
    select?: BuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Build
     */
    omit?: BuildOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuildInclude<ExtArgs> | null
    /**
     * Filter, which Builds to fetch.
     */
    where?: BuildWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Builds to fetch.
     */
    orderBy?: BuildOrderByWithRelationInput | BuildOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Builds.
     */
    cursor?: BuildWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Builds from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Builds.
     */
    skip?: number
    distinct?: BuildScalarFieldEnum | BuildScalarFieldEnum[]
  }

  /**
   * Build create
   */
  export type BuildCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Build
     */
    select?: BuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Build
     */
    omit?: BuildOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuildInclude<ExtArgs> | null
    /**
     * The data needed to create a Build.
     */
    data: XOR<BuildCreateInput, BuildUncheckedCreateInput>
  }

  /**
   * Build createMany
   */
  export type BuildCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Builds.
     */
    data: BuildCreateManyInput | BuildCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Build createManyAndReturn
   */
  export type BuildCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Build
     */
    select?: BuildSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Build
     */
    omit?: BuildOmit<ExtArgs> | null
    /**
     * The data used to create many Builds.
     */
    data: BuildCreateManyInput | BuildCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Build update
   */
  export type BuildUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Build
     */
    select?: BuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Build
     */
    omit?: BuildOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuildInclude<ExtArgs> | null
    /**
     * The data needed to update a Build.
     */
    data: XOR<BuildUpdateInput, BuildUncheckedUpdateInput>
    /**
     * Choose, which Build to update.
     */
    where: BuildWhereUniqueInput
  }

  /**
   * Build updateMany
   */
  export type BuildUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Builds.
     */
    data: XOR<BuildUpdateManyMutationInput, BuildUncheckedUpdateManyInput>
    /**
     * Filter which Builds to update
     */
    where?: BuildWhereInput
    /**
     * Limit how many Builds to update.
     */
    limit?: number
  }

  /**
   * Build updateManyAndReturn
   */
  export type BuildUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Build
     */
    select?: BuildSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Build
     */
    omit?: BuildOmit<ExtArgs> | null
    /**
     * The data used to update Builds.
     */
    data: XOR<BuildUpdateManyMutationInput, BuildUncheckedUpdateManyInput>
    /**
     * Filter which Builds to update
     */
    where?: BuildWhereInput
    /**
     * Limit how many Builds to update.
     */
    limit?: number
  }

  /**
   * Build upsert
   */
  export type BuildUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Build
     */
    select?: BuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Build
     */
    omit?: BuildOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuildInclude<ExtArgs> | null
    /**
     * The filter to search for the Build to update in case it exists.
     */
    where: BuildWhereUniqueInput
    /**
     * In case the Build found by the `where` argument doesn't exist, create a new Build with this data.
     */
    create: XOR<BuildCreateInput, BuildUncheckedCreateInput>
    /**
     * In case the Build was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BuildUpdateInput, BuildUncheckedUpdateInput>
  }

  /**
   * Build delete
   */
  export type BuildDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Build
     */
    select?: BuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Build
     */
    omit?: BuildOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuildInclude<ExtArgs> | null
    /**
     * Filter which Build to delete.
     */
    where: BuildWhereUniqueInput
  }

  /**
   * Build deleteMany
   */
  export type BuildDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Builds to delete
     */
    where?: BuildWhereInput
    /**
     * Limit how many Builds to delete.
     */
    limit?: number
  }

  /**
   * Build.runs
   */
  export type Build$runsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Run
     */
    select?: RunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Run
     */
    omit?: RunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RunInclude<ExtArgs> | null
    where?: RunWhereInput
    orderBy?: RunOrderByWithRelationInput | RunOrderByWithRelationInput[]
    cursor?: RunWhereUniqueInput
    take?: number
    skip?: number
    distinct?: RunScalarFieldEnum | RunScalarFieldEnum[]
  }

  /**
   * Build without action
   */
  export type BuildDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Build
     */
    select?: BuildSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Build
     */
    omit?: BuildOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BuildInclude<ExtArgs> | null
  }


  /**
   * Model Run
   */

  export type AggregateRun = {
    _count: RunCountAggregateOutputType | null
    _min: RunMinAggregateOutputType | null
    _max: RunMaxAggregateOutputType | null
  }

  export type RunMinAggregateOutputType = {
    id: string | null
    buildId: string | null
    targetUrls: string | null
    status: $Enums.RunStatus | null
    error: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RunMaxAggregateOutputType = {
    id: string | null
    buildId: string | null
    targetUrls: string | null
    status: $Enums.RunStatus | null
    error: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type RunCountAggregateOutputType = {
    id: number
    buildId: number
    targetUrls: number
    status: number
    resultJson: number
    error: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type RunMinAggregateInputType = {
    id?: true
    buildId?: true
    targetUrls?: true
    status?: true
    error?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RunMaxAggregateInputType = {
    id?: true
    buildId?: true
    targetUrls?: true
    status?: true
    error?: true
    createdAt?: true
    updatedAt?: true
  }

  export type RunCountAggregateInputType = {
    id?: true
    buildId?: true
    targetUrls?: true
    status?: true
    resultJson?: true
    error?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type RunAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Run to aggregate.
     */
    where?: RunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Runs to fetch.
     */
    orderBy?: RunOrderByWithRelationInput | RunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Runs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Runs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Runs
    **/
    _count?: true | RunCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RunMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RunMaxAggregateInputType
  }

  export type GetRunAggregateType<T extends RunAggregateArgs> = {
        [P in keyof T & keyof AggregateRun]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRun[P]>
      : GetScalarType<T[P], AggregateRun[P]>
  }




  export type RunGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RunWhereInput
    orderBy?: RunOrderByWithAggregationInput | RunOrderByWithAggregationInput[]
    by: RunScalarFieldEnum[] | RunScalarFieldEnum
    having?: RunScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RunCountAggregateInputType | true
    _min?: RunMinAggregateInputType
    _max?: RunMaxAggregateInputType
  }

  export type RunGroupByOutputType = {
    id: string
    buildId: string
    targetUrls: string
    status: $Enums.RunStatus
    resultJson: JsonValue | null
    error: string | null
    createdAt: Date
    updatedAt: Date
    _count: RunCountAggregateOutputType | null
    _min: RunMinAggregateOutputType | null
    _max: RunMaxAggregateOutputType | null
  }

  type GetRunGroupByPayload<T extends RunGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RunGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RunGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RunGroupByOutputType[P]>
            : GetScalarType<T[P], RunGroupByOutputType[P]>
        }
      >
    >


  export type RunSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    buildId?: boolean
    targetUrls?: boolean
    status?: boolean
    resultJson?: boolean
    error?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    build?: boolean | BuildDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["run"]>

  export type RunSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    buildId?: boolean
    targetUrls?: boolean
    status?: boolean
    resultJson?: boolean
    error?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    build?: boolean | BuildDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["run"]>

  export type RunSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    buildId?: boolean
    targetUrls?: boolean
    status?: boolean
    resultJson?: boolean
    error?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    build?: boolean | BuildDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["run"]>

  export type RunSelectScalar = {
    id?: boolean
    buildId?: boolean
    targetUrls?: boolean
    status?: boolean
    resultJson?: boolean
    error?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type RunOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "buildId" | "targetUrls" | "status" | "resultJson" | "error" | "createdAt" | "updatedAt", ExtArgs["result"]["run"]>
  export type RunInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    build?: boolean | BuildDefaultArgs<ExtArgs>
  }
  export type RunIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    build?: boolean | BuildDefaultArgs<ExtArgs>
  }
  export type RunIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    build?: boolean | BuildDefaultArgs<ExtArgs>
  }

  export type $RunPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Run"
    objects: {
      build: Prisma.$BuildPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      buildId: string
      targetUrls: string
      status: $Enums.RunStatus
      resultJson: Prisma.JsonValue | null
      error: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["run"]>
    composites: {}
  }

  type RunGetPayload<S extends boolean | null | undefined | RunDefaultArgs> = $Result.GetResult<Prisma.$RunPayload, S>

  type RunCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RunFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RunCountAggregateInputType | true
    }

  export interface RunDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Run'], meta: { name: 'Run' } }
    /**
     * Find zero or one Run that matches the filter.
     * @param {RunFindUniqueArgs} args - Arguments to find a Run
     * @example
     * // Get one Run
     * const run = await prisma.run.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RunFindUniqueArgs>(args: SelectSubset<T, RunFindUniqueArgs<ExtArgs>>): Prisma__RunClient<$Result.GetResult<Prisma.$RunPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Run that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RunFindUniqueOrThrowArgs} args - Arguments to find a Run
     * @example
     * // Get one Run
     * const run = await prisma.run.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RunFindUniqueOrThrowArgs>(args: SelectSubset<T, RunFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RunClient<$Result.GetResult<Prisma.$RunPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Run that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RunFindFirstArgs} args - Arguments to find a Run
     * @example
     * // Get one Run
     * const run = await prisma.run.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RunFindFirstArgs>(args?: SelectSubset<T, RunFindFirstArgs<ExtArgs>>): Prisma__RunClient<$Result.GetResult<Prisma.$RunPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Run that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RunFindFirstOrThrowArgs} args - Arguments to find a Run
     * @example
     * // Get one Run
     * const run = await prisma.run.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RunFindFirstOrThrowArgs>(args?: SelectSubset<T, RunFindFirstOrThrowArgs<ExtArgs>>): Prisma__RunClient<$Result.GetResult<Prisma.$RunPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Runs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RunFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Runs
     * const runs = await prisma.run.findMany()
     * 
     * // Get first 10 Runs
     * const runs = await prisma.run.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const runWithIdOnly = await prisma.run.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RunFindManyArgs>(args?: SelectSubset<T, RunFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RunPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Run.
     * @param {RunCreateArgs} args - Arguments to create a Run.
     * @example
     * // Create one Run
     * const Run = await prisma.run.create({
     *   data: {
     *     // ... data to create a Run
     *   }
     * })
     * 
     */
    create<T extends RunCreateArgs>(args: SelectSubset<T, RunCreateArgs<ExtArgs>>): Prisma__RunClient<$Result.GetResult<Prisma.$RunPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Runs.
     * @param {RunCreateManyArgs} args - Arguments to create many Runs.
     * @example
     * // Create many Runs
     * const run = await prisma.run.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RunCreateManyArgs>(args?: SelectSubset<T, RunCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Runs and returns the data saved in the database.
     * @param {RunCreateManyAndReturnArgs} args - Arguments to create many Runs.
     * @example
     * // Create many Runs
     * const run = await prisma.run.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Runs and only return the `id`
     * const runWithIdOnly = await prisma.run.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RunCreateManyAndReturnArgs>(args?: SelectSubset<T, RunCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RunPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Run.
     * @param {RunDeleteArgs} args - Arguments to delete one Run.
     * @example
     * // Delete one Run
     * const Run = await prisma.run.delete({
     *   where: {
     *     // ... filter to delete one Run
     *   }
     * })
     * 
     */
    delete<T extends RunDeleteArgs>(args: SelectSubset<T, RunDeleteArgs<ExtArgs>>): Prisma__RunClient<$Result.GetResult<Prisma.$RunPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Run.
     * @param {RunUpdateArgs} args - Arguments to update one Run.
     * @example
     * // Update one Run
     * const run = await prisma.run.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RunUpdateArgs>(args: SelectSubset<T, RunUpdateArgs<ExtArgs>>): Prisma__RunClient<$Result.GetResult<Prisma.$RunPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Runs.
     * @param {RunDeleteManyArgs} args - Arguments to filter Runs to delete.
     * @example
     * // Delete a few Runs
     * const { count } = await prisma.run.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RunDeleteManyArgs>(args?: SelectSubset<T, RunDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Runs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RunUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Runs
     * const run = await prisma.run.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RunUpdateManyArgs>(args: SelectSubset<T, RunUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Runs and returns the data updated in the database.
     * @param {RunUpdateManyAndReturnArgs} args - Arguments to update many Runs.
     * @example
     * // Update many Runs
     * const run = await prisma.run.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Runs and only return the `id`
     * const runWithIdOnly = await prisma.run.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RunUpdateManyAndReturnArgs>(args: SelectSubset<T, RunUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RunPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Run.
     * @param {RunUpsertArgs} args - Arguments to update or create a Run.
     * @example
     * // Update or create a Run
     * const run = await prisma.run.upsert({
     *   create: {
     *     // ... data to create a Run
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Run we want to update
     *   }
     * })
     */
    upsert<T extends RunUpsertArgs>(args: SelectSubset<T, RunUpsertArgs<ExtArgs>>): Prisma__RunClient<$Result.GetResult<Prisma.$RunPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Runs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RunCountArgs} args - Arguments to filter Runs to count.
     * @example
     * // Count the number of Runs
     * const count = await prisma.run.count({
     *   where: {
     *     // ... the filter for the Runs we want to count
     *   }
     * })
    **/
    count<T extends RunCountArgs>(
      args?: Subset<T, RunCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RunCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Run.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RunAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RunAggregateArgs>(args: Subset<T, RunAggregateArgs>): Prisma.PrismaPromise<GetRunAggregateType<T>>

    /**
     * Group by Run.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RunGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RunGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RunGroupByArgs['orderBy'] }
        : { orderBy?: RunGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RunGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRunGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Run model
   */
  readonly fields: RunFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Run.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RunClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    build<T extends BuildDefaultArgs<ExtArgs> = {}>(args?: Subset<T, BuildDefaultArgs<ExtArgs>>): Prisma__BuildClient<$Result.GetResult<Prisma.$BuildPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Run model
   */
  interface RunFieldRefs {
    readonly id: FieldRef<"Run", 'String'>
    readonly buildId: FieldRef<"Run", 'String'>
    readonly targetUrls: FieldRef<"Run", 'String'>
    readonly status: FieldRef<"Run", 'RunStatus'>
    readonly resultJson: FieldRef<"Run", 'Json'>
    readonly error: FieldRef<"Run", 'String'>
    readonly createdAt: FieldRef<"Run", 'DateTime'>
    readonly updatedAt: FieldRef<"Run", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Run findUnique
   */
  export type RunFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Run
     */
    select?: RunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Run
     */
    omit?: RunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RunInclude<ExtArgs> | null
    /**
     * Filter, which Run to fetch.
     */
    where: RunWhereUniqueInput
  }

  /**
   * Run findUniqueOrThrow
   */
  export type RunFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Run
     */
    select?: RunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Run
     */
    omit?: RunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RunInclude<ExtArgs> | null
    /**
     * Filter, which Run to fetch.
     */
    where: RunWhereUniqueInput
  }

  /**
   * Run findFirst
   */
  export type RunFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Run
     */
    select?: RunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Run
     */
    omit?: RunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RunInclude<ExtArgs> | null
    /**
     * Filter, which Run to fetch.
     */
    where?: RunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Runs to fetch.
     */
    orderBy?: RunOrderByWithRelationInput | RunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Runs.
     */
    cursor?: RunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Runs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Runs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Runs.
     */
    distinct?: RunScalarFieldEnum | RunScalarFieldEnum[]
  }

  /**
   * Run findFirstOrThrow
   */
  export type RunFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Run
     */
    select?: RunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Run
     */
    omit?: RunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RunInclude<ExtArgs> | null
    /**
     * Filter, which Run to fetch.
     */
    where?: RunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Runs to fetch.
     */
    orderBy?: RunOrderByWithRelationInput | RunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Runs.
     */
    cursor?: RunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Runs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Runs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Runs.
     */
    distinct?: RunScalarFieldEnum | RunScalarFieldEnum[]
  }

  /**
   * Run findMany
   */
  export type RunFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Run
     */
    select?: RunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Run
     */
    omit?: RunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RunInclude<ExtArgs> | null
    /**
     * Filter, which Runs to fetch.
     */
    where?: RunWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Runs to fetch.
     */
    orderBy?: RunOrderByWithRelationInput | RunOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Runs.
     */
    cursor?: RunWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Runs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Runs.
     */
    skip?: number
    distinct?: RunScalarFieldEnum | RunScalarFieldEnum[]
  }

  /**
   * Run create
   */
  export type RunCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Run
     */
    select?: RunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Run
     */
    omit?: RunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RunInclude<ExtArgs> | null
    /**
     * The data needed to create a Run.
     */
    data: XOR<RunCreateInput, RunUncheckedCreateInput>
  }

  /**
   * Run createMany
   */
  export type RunCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Runs.
     */
    data: RunCreateManyInput | RunCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Run createManyAndReturn
   */
  export type RunCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Run
     */
    select?: RunSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Run
     */
    omit?: RunOmit<ExtArgs> | null
    /**
     * The data used to create many Runs.
     */
    data: RunCreateManyInput | RunCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RunIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Run update
   */
  export type RunUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Run
     */
    select?: RunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Run
     */
    omit?: RunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RunInclude<ExtArgs> | null
    /**
     * The data needed to update a Run.
     */
    data: XOR<RunUpdateInput, RunUncheckedUpdateInput>
    /**
     * Choose, which Run to update.
     */
    where: RunWhereUniqueInput
  }

  /**
   * Run updateMany
   */
  export type RunUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Runs.
     */
    data: XOR<RunUpdateManyMutationInput, RunUncheckedUpdateManyInput>
    /**
     * Filter which Runs to update
     */
    where?: RunWhereInput
    /**
     * Limit how many Runs to update.
     */
    limit?: number
  }

  /**
   * Run updateManyAndReturn
   */
  export type RunUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Run
     */
    select?: RunSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Run
     */
    omit?: RunOmit<ExtArgs> | null
    /**
     * The data used to update Runs.
     */
    data: XOR<RunUpdateManyMutationInput, RunUncheckedUpdateManyInput>
    /**
     * Filter which Runs to update
     */
    where?: RunWhereInput
    /**
     * Limit how many Runs to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RunIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Run upsert
   */
  export type RunUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Run
     */
    select?: RunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Run
     */
    omit?: RunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RunInclude<ExtArgs> | null
    /**
     * The filter to search for the Run to update in case it exists.
     */
    where: RunWhereUniqueInput
    /**
     * In case the Run found by the `where` argument doesn't exist, create a new Run with this data.
     */
    create: XOR<RunCreateInput, RunUncheckedCreateInput>
    /**
     * In case the Run was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RunUpdateInput, RunUncheckedUpdateInput>
  }

  /**
   * Run delete
   */
  export type RunDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Run
     */
    select?: RunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Run
     */
    omit?: RunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RunInclude<ExtArgs> | null
    /**
     * Filter which Run to delete.
     */
    where: RunWhereUniqueInput
  }

  /**
   * Run deleteMany
   */
  export type RunDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Runs to delete
     */
    where?: RunWhereInput
    /**
     * Limit how many Runs to delete.
     */
    limit?: number
  }

  /**
   * Run without action
   */
  export type RunDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Run
     */
    select?: RunSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Run
     */
    omit?: RunOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RunInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const BuildScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    targetUrls: 'targetUrls',
    userObjective: 'userObjective',
    status: 'status',
    error: 'error',
    initialPackageJson: 'initialPackageJson',
    sampleResultsJson: 'sampleResultsJson',
    finalConfigurationJson: 'finalConfigurationJson',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type BuildScalarFieldEnum = (typeof BuildScalarFieldEnum)[keyof typeof BuildScalarFieldEnum]


  export const RunScalarFieldEnum: {
    id: 'id',
    buildId: 'buildId',
    targetUrls: 'targetUrls',
    status: 'status',
    resultJson: 'resultJson',
    error: 'error',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type RunScalarFieldEnum = (typeof RunScalarFieldEnum)[keyof typeof RunScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'BuildStatus'
   */
  export type EnumBuildStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BuildStatus'>
    


  /**
   * Reference to a field of type 'BuildStatus[]'
   */
  export type ListEnumBuildStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BuildStatus[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'RunStatus'
   */
  export type EnumRunStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RunStatus'>
    


  /**
   * Reference to a field of type 'RunStatus[]'
   */
  export type ListEnumRunStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'RunStatus[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    
  /**
   * Deep Input Types
   */


  export type BuildWhereInput = {
    AND?: BuildWhereInput | BuildWhereInput[]
    OR?: BuildWhereInput[]
    NOT?: BuildWhereInput | BuildWhereInput[]
    id?: StringFilter<"Build"> | string
    userId?: StringNullableFilter<"Build"> | string | null
    targetUrls?: StringFilter<"Build"> | string
    userObjective?: StringFilter<"Build"> | string
    status?: EnumBuildStatusFilter<"Build"> | $Enums.BuildStatus
    error?: StringNullableFilter<"Build"> | string | null
    initialPackageJson?: JsonNullableFilter<"Build">
    sampleResultsJson?: JsonNullableFilter<"Build">
    finalConfigurationJson?: JsonNullableFilter<"Build">
    createdAt?: DateTimeFilter<"Build"> | Date | string
    updatedAt?: DateTimeFilter<"Build"> | Date | string
    runs?: RunListRelationFilter
  }

  export type BuildOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrderInput | SortOrder
    targetUrls?: SortOrder
    userObjective?: SortOrder
    status?: SortOrder
    error?: SortOrderInput | SortOrder
    initialPackageJson?: SortOrderInput | SortOrder
    sampleResultsJson?: SortOrderInput | SortOrder
    finalConfigurationJson?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    runs?: RunOrderByRelationAggregateInput
  }

  export type BuildWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BuildWhereInput | BuildWhereInput[]
    OR?: BuildWhereInput[]
    NOT?: BuildWhereInput | BuildWhereInput[]
    userId?: StringNullableFilter<"Build"> | string | null
    targetUrls?: StringFilter<"Build"> | string
    userObjective?: StringFilter<"Build"> | string
    status?: EnumBuildStatusFilter<"Build"> | $Enums.BuildStatus
    error?: StringNullableFilter<"Build"> | string | null
    initialPackageJson?: JsonNullableFilter<"Build">
    sampleResultsJson?: JsonNullableFilter<"Build">
    finalConfigurationJson?: JsonNullableFilter<"Build">
    createdAt?: DateTimeFilter<"Build"> | Date | string
    updatedAt?: DateTimeFilter<"Build"> | Date | string
    runs?: RunListRelationFilter
  }, "id">

  export type BuildOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrderInput | SortOrder
    targetUrls?: SortOrder
    userObjective?: SortOrder
    status?: SortOrder
    error?: SortOrderInput | SortOrder
    initialPackageJson?: SortOrderInput | SortOrder
    sampleResultsJson?: SortOrderInput | SortOrder
    finalConfigurationJson?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: BuildCountOrderByAggregateInput
    _max?: BuildMaxOrderByAggregateInput
    _min?: BuildMinOrderByAggregateInput
  }

  export type BuildScalarWhereWithAggregatesInput = {
    AND?: BuildScalarWhereWithAggregatesInput | BuildScalarWhereWithAggregatesInput[]
    OR?: BuildScalarWhereWithAggregatesInput[]
    NOT?: BuildScalarWhereWithAggregatesInput | BuildScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Build"> | string
    userId?: StringNullableWithAggregatesFilter<"Build"> | string | null
    targetUrls?: StringWithAggregatesFilter<"Build"> | string
    userObjective?: StringWithAggregatesFilter<"Build"> | string
    status?: EnumBuildStatusWithAggregatesFilter<"Build"> | $Enums.BuildStatus
    error?: StringNullableWithAggregatesFilter<"Build"> | string | null
    initialPackageJson?: JsonNullableWithAggregatesFilter<"Build">
    sampleResultsJson?: JsonNullableWithAggregatesFilter<"Build">
    finalConfigurationJson?: JsonNullableWithAggregatesFilter<"Build">
    createdAt?: DateTimeWithAggregatesFilter<"Build"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Build"> | Date | string
  }

  export type RunWhereInput = {
    AND?: RunWhereInput | RunWhereInput[]
    OR?: RunWhereInput[]
    NOT?: RunWhereInput | RunWhereInput[]
    id?: StringFilter<"Run"> | string
    buildId?: StringFilter<"Run"> | string
    targetUrls?: StringFilter<"Run"> | string
    status?: EnumRunStatusFilter<"Run"> | $Enums.RunStatus
    resultJson?: JsonNullableFilter<"Run">
    error?: StringNullableFilter<"Run"> | string | null
    createdAt?: DateTimeFilter<"Run"> | Date | string
    updatedAt?: DateTimeFilter<"Run"> | Date | string
    build?: XOR<BuildScalarRelationFilter, BuildWhereInput>
  }

  export type RunOrderByWithRelationInput = {
    id?: SortOrder
    buildId?: SortOrder
    targetUrls?: SortOrder
    status?: SortOrder
    resultJson?: SortOrderInput | SortOrder
    error?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    build?: BuildOrderByWithRelationInput
  }

  export type RunWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: RunWhereInput | RunWhereInput[]
    OR?: RunWhereInput[]
    NOT?: RunWhereInput | RunWhereInput[]
    buildId?: StringFilter<"Run"> | string
    targetUrls?: StringFilter<"Run"> | string
    status?: EnumRunStatusFilter<"Run"> | $Enums.RunStatus
    resultJson?: JsonNullableFilter<"Run">
    error?: StringNullableFilter<"Run"> | string | null
    createdAt?: DateTimeFilter<"Run"> | Date | string
    updatedAt?: DateTimeFilter<"Run"> | Date | string
    build?: XOR<BuildScalarRelationFilter, BuildWhereInput>
  }, "id">

  export type RunOrderByWithAggregationInput = {
    id?: SortOrder
    buildId?: SortOrder
    targetUrls?: SortOrder
    status?: SortOrder
    resultJson?: SortOrderInput | SortOrder
    error?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: RunCountOrderByAggregateInput
    _max?: RunMaxOrderByAggregateInput
    _min?: RunMinOrderByAggregateInput
  }

  export type RunScalarWhereWithAggregatesInput = {
    AND?: RunScalarWhereWithAggregatesInput | RunScalarWhereWithAggregatesInput[]
    OR?: RunScalarWhereWithAggregatesInput[]
    NOT?: RunScalarWhereWithAggregatesInput | RunScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Run"> | string
    buildId?: StringWithAggregatesFilter<"Run"> | string
    targetUrls?: StringWithAggregatesFilter<"Run"> | string
    status?: EnumRunStatusWithAggregatesFilter<"Run"> | $Enums.RunStatus
    resultJson?: JsonNullableWithAggregatesFilter<"Run">
    error?: StringNullableWithAggregatesFilter<"Run"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Run"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Run"> | Date | string
  }

  export type BuildCreateInput = {
    id?: string
    userId?: string | null
    targetUrls: string
    userObjective: string
    status?: $Enums.BuildStatus
    error?: string | null
    initialPackageJson?: NullableJsonNullValueInput | InputJsonValue
    sampleResultsJson?: NullableJsonNullValueInput | InputJsonValue
    finalConfigurationJson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    runs?: RunCreateNestedManyWithoutBuildInput
  }

  export type BuildUncheckedCreateInput = {
    id?: string
    userId?: string | null
    targetUrls: string
    userObjective: string
    status?: $Enums.BuildStatus
    error?: string | null
    initialPackageJson?: NullableJsonNullValueInput | InputJsonValue
    sampleResultsJson?: NullableJsonNullValueInput | InputJsonValue
    finalConfigurationJson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
    runs?: RunUncheckedCreateNestedManyWithoutBuildInput
  }

  export type BuildUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    targetUrls?: StringFieldUpdateOperationsInput | string
    userObjective?: StringFieldUpdateOperationsInput | string
    status?: EnumBuildStatusFieldUpdateOperationsInput | $Enums.BuildStatus
    error?: NullableStringFieldUpdateOperationsInput | string | null
    initialPackageJson?: NullableJsonNullValueInput | InputJsonValue
    sampleResultsJson?: NullableJsonNullValueInput | InputJsonValue
    finalConfigurationJson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    runs?: RunUpdateManyWithoutBuildNestedInput
  }

  export type BuildUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    targetUrls?: StringFieldUpdateOperationsInput | string
    userObjective?: StringFieldUpdateOperationsInput | string
    status?: EnumBuildStatusFieldUpdateOperationsInput | $Enums.BuildStatus
    error?: NullableStringFieldUpdateOperationsInput | string | null
    initialPackageJson?: NullableJsonNullValueInput | InputJsonValue
    sampleResultsJson?: NullableJsonNullValueInput | InputJsonValue
    finalConfigurationJson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    runs?: RunUncheckedUpdateManyWithoutBuildNestedInput
  }

  export type BuildCreateManyInput = {
    id?: string
    userId?: string | null
    targetUrls: string
    userObjective: string
    status?: $Enums.BuildStatus
    error?: string | null
    initialPackageJson?: NullableJsonNullValueInput | InputJsonValue
    sampleResultsJson?: NullableJsonNullValueInput | InputJsonValue
    finalConfigurationJson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BuildUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    targetUrls?: StringFieldUpdateOperationsInput | string
    userObjective?: StringFieldUpdateOperationsInput | string
    status?: EnumBuildStatusFieldUpdateOperationsInput | $Enums.BuildStatus
    error?: NullableStringFieldUpdateOperationsInput | string | null
    initialPackageJson?: NullableJsonNullValueInput | InputJsonValue
    sampleResultsJson?: NullableJsonNullValueInput | InputJsonValue
    finalConfigurationJson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BuildUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    targetUrls?: StringFieldUpdateOperationsInput | string
    userObjective?: StringFieldUpdateOperationsInput | string
    status?: EnumBuildStatusFieldUpdateOperationsInput | $Enums.BuildStatus
    error?: NullableStringFieldUpdateOperationsInput | string | null
    initialPackageJson?: NullableJsonNullValueInput | InputJsonValue
    sampleResultsJson?: NullableJsonNullValueInput | InputJsonValue
    finalConfigurationJson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RunCreateInput = {
    id?: string
    targetUrls: string
    status?: $Enums.RunStatus
    resultJson?: NullableJsonNullValueInput | InputJsonValue
    error?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
    build: BuildCreateNestedOneWithoutRunsInput
  }

  export type RunUncheckedCreateInput = {
    id?: string
    buildId: string
    targetUrls: string
    status?: $Enums.RunStatus
    resultJson?: NullableJsonNullValueInput | InputJsonValue
    error?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RunUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    targetUrls?: StringFieldUpdateOperationsInput | string
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    resultJson?: NullableJsonNullValueInput | InputJsonValue
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    build?: BuildUpdateOneRequiredWithoutRunsNestedInput
  }

  export type RunUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    buildId?: StringFieldUpdateOperationsInput | string
    targetUrls?: StringFieldUpdateOperationsInput | string
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    resultJson?: NullableJsonNullValueInput | InputJsonValue
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RunCreateManyInput = {
    id?: string
    buildId: string
    targetUrls: string
    status?: $Enums.RunStatus
    resultJson?: NullableJsonNullValueInput | InputJsonValue
    error?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RunUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    targetUrls?: StringFieldUpdateOperationsInput | string
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    resultJson?: NullableJsonNullValueInput | InputJsonValue
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RunUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    buildId?: StringFieldUpdateOperationsInput | string
    targetUrls?: StringFieldUpdateOperationsInput | string
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    resultJson?: NullableJsonNullValueInput | InputJsonValue
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type EnumBuildStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.BuildStatus | EnumBuildStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BuildStatus[] | ListEnumBuildStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BuildStatus[] | ListEnumBuildStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBuildStatusFilter<$PrismaModel> | $Enums.BuildStatus
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type RunListRelationFilter = {
    every?: RunWhereInput
    some?: RunWhereInput
    none?: RunWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type RunOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BuildCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    targetUrls?: SortOrder
    userObjective?: SortOrder
    status?: SortOrder
    error?: SortOrder
    initialPackageJson?: SortOrder
    sampleResultsJson?: SortOrder
    finalConfigurationJson?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BuildMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    targetUrls?: SortOrder
    userObjective?: SortOrder
    status?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type BuildMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    targetUrls?: SortOrder
    userObjective?: SortOrder
    status?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type EnumBuildStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BuildStatus | EnumBuildStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BuildStatus[] | ListEnumBuildStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BuildStatus[] | ListEnumBuildStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBuildStatusWithAggregatesFilter<$PrismaModel> | $Enums.BuildStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBuildStatusFilter<$PrismaModel>
    _max?: NestedEnumBuildStatusFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type EnumRunStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RunStatus | EnumRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRunStatusFilter<$PrismaModel> | $Enums.RunStatus
  }

  export type BuildScalarRelationFilter = {
    is?: BuildWhereInput
    isNot?: BuildWhereInput
  }

  export type RunCountOrderByAggregateInput = {
    id?: SortOrder
    buildId?: SortOrder
    targetUrls?: SortOrder
    status?: SortOrder
    resultJson?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RunMaxOrderByAggregateInput = {
    id?: SortOrder
    buildId?: SortOrder
    targetUrls?: SortOrder
    status?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type RunMinOrderByAggregateInput = {
    id?: SortOrder
    buildId?: SortOrder
    targetUrls?: SortOrder
    status?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EnumRunStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RunStatus | EnumRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRunStatusWithAggregatesFilter<$PrismaModel> | $Enums.RunStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRunStatusFilter<$PrismaModel>
    _max?: NestedEnumRunStatusFilter<$PrismaModel>
  }

  export type RunCreateNestedManyWithoutBuildInput = {
    create?: XOR<RunCreateWithoutBuildInput, RunUncheckedCreateWithoutBuildInput> | RunCreateWithoutBuildInput[] | RunUncheckedCreateWithoutBuildInput[]
    connectOrCreate?: RunCreateOrConnectWithoutBuildInput | RunCreateOrConnectWithoutBuildInput[]
    createMany?: RunCreateManyBuildInputEnvelope
    connect?: RunWhereUniqueInput | RunWhereUniqueInput[]
  }

  export type RunUncheckedCreateNestedManyWithoutBuildInput = {
    create?: XOR<RunCreateWithoutBuildInput, RunUncheckedCreateWithoutBuildInput> | RunCreateWithoutBuildInput[] | RunUncheckedCreateWithoutBuildInput[]
    connectOrCreate?: RunCreateOrConnectWithoutBuildInput | RunCreateOrConnectWithoutBuildInput[]
    createMany?: RunCreateManyBuildInputEnvelope
    connect?: RunWhereUniqueInput | RunWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type EnumBuildStatusFieldUpdateOperationsInput = {
    set?: $Enums.BuildStatus
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type RunUpdateManyWithoutBuildNestedInput = {
    create?: XOR<RunCreateWithoutBuildInput, RunUncheckedCreateWithoutBuildInput> | RunCreateWithoutBuildInput[] | RunUncheckedCreateWithoutBuildInput[]
    connectOrCreate?: RunCreateOrConnectWithoutBuildInput | RunCreateOrConnectWithoutBuildInput[]
    upsert?: RunUpsertWithWhereUniqueWithoutBuildInput | RunUpsertWithWhereUniqueWithoutBuildInput[]
    createMany?: RunCreateManyBuildInputEnvelope
    set?: RunWhereUniqueInput | RunWhereUniqueInput[]
    disconnect?: RunWhereUniqueInput | RunWhereUniqueInput[]
    delete?: RunWhereUniqueInput | RunWhereUniqueInput[]
    connect?: RunWhereUniqueInput | RunWhereUniqueInput[]
    update?: RunUpdateWithWhereUniqueWithoutBuildInput | RunUpdateWithWhereUniqueWithoutBuildInput[]
    updateMany?: RunUpdateManyWithWhereWithoutBuildInput | RunUpdateManyWithWhereWithoutBuildInput[]
    deleteMany?: RunScalarWhereInput | RunScalarWhereInput[]
  }

  export type RunUncheckedUpdateManyWithoutBuildNestedInput = {
    create?: XOR<RunCreateWithoutBuildInput, RunUncheckedCreateWithoutBuildInput> | RunCreateWithoutBuildInput[] | RunUncheckedCreateWithoutBuildInput[]
    connectOrCreate?: RunCreateOrConnectWithoutBuildInput | RunCreateOrConnectWithoutBuildInput[]
    upsert?: RunUpsertWithWhereUniqueWithoutBuildInput | RunUpsertWithWhereUniqueWithoutBuildInput[]
    createMany?: RunCreateManyBuildInputEnvelope
    set?: RunWhereUniqueInput | RunWhereUniqueInput[]
    disconnect?: RunWhereUniqueInput | RunWhereUniqueInput[]
    delete?: RunWhereUniqueInput | RunWhereUniqueInput[]
    connect?: RunWhereUniqueInput | RunWhereUniqueInput[]
    update?: RunUpdateWithWhereUniqueWithoutBuildInput | RunUpdateWithWhereUniqueWithoutBuildInput[]
    updateMany?: RunUpdateManyWithWhereWithoutBuildInput | RunUpdateManyWithWhereWithoutBuildInput[]
    deleteMany?: RunScalarWhereInput | RunScalarWhereInput[]
  }

  export type BuildCreateNestedOneWithoutRunsInput = {
    create?: XOR<BuildCreateWithoutRunsInput, BuildUncheckedCreateWithoutRunsInput>
    connectOrCreate?: BuildCreateOrConnectWithoutRunsInput
    connect?: BuildWhereUniqueInput
  }

  export type EnumRunStatusFieldUpdateOperationsInput = {
    set?: $Enums.RunStatus
  }

  export type BuildUpdateOneRequiredWithoutRunsNestedInput = {
    create?: XOR<BuildCreateWithoutRunsInput, BuildUncheckedCreateWithoutRunsInput>
    connectOrCreate?: BuildCreateOrConnectWithoutRunsInput
    upsert?: BuildUpsertWithoutRunsInput
    connect?: BuildWhereUniqueInput
    update?: XOR<XOR<BuildUpdateToOneWithWhereWithoutRunsInput, BuildUpdateWithoutRunsInput>, BuildUncheckedUpdateWithoutRunsInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumBuildStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.BuildStatus | EnumBuildStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BuildStatus[] | ListEnumBuildStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BuildStatus[] | ListEnumBuildStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBuildStatusFilter<$PrismaModel> | $Enums.BuildStatus
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumBuildStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.BuildStatus | EnumBuildStatusFieldRefInput<$PrismaModel>
    in?: $Enums.BuildStatus[] | ListEnumBuildStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.BuildStatus[] | ListEnumBuildStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumBuildStatusWithAggregatesFilter<$PrismaModel> | $Enums.BuildStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumBuildStatusFilter<$PrismaModel>
    _max?: NestedEnumBuildStatusFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedEnumRunStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.RunStatus | EnumRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRunStatusFilter<$PrismaModel> | $Enums.RunStatus
  }

  export type NestedEnumRunStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.RunStatus | EnumRunStatusFieldRefInput<$PrismaModel>
    in?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.RunStatus[] | ListEnumRunStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumRunStatusWithAggregatesFilter<$PrismaModel> | $Enums.RunStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumRunStatusFilter<$PrismaModel>
    _max?: NestedEnumRunStatusFilter<$PrismaModel>
  }

  export type RunCreateWithoutBuildInput = {
    id?: string
    targetUrls: string
    status?: $Enums.RunStatus
    resultJson?: NullableJsonNullValueInput | InputJsonValue
    error?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RunUncheckedCreateWithoutBuildInput = {
    id?: string
    targetUrls: string
    status?: $Enums.RunStatus
    resultJson?: NullableJsonNullValueInput | InputJsonValue
    error?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RunCreateOrConnectWithoutBuildInput = {
    where: RunWhereUniqueInput
    create: XOR<RunCreateWithoutBuildInput, RunUncheckedCreateWithoutBuildInput>
  }

  export type RunCreateManyBuildInputEnvelope = {
    data: RunCreateManyBuildInput | RunCreateManyBuildInput[]
    skipDuplicates?: boolean
  }

  export type RunUpsertWithWhereUniqueWithoutBuildInput = {
    where: RunWhereUniqueInput
    update: XOR<RunUpdateWithoutBuildInput, RunUncheckedUpdateWithoutBuildInput>
    create: XOR<RunCreateWithoutBuildInput, RunUncheckedCreateWithoutBuildInput>
  }

  export type RunUpdateWithWhereUniqueWithoutBuildInput = {
    where: RunWhereUniqueInput
    data: XOR<RunUpdateWithoutBuildInput, RunUncheckedUpdateWithoutBuildInput>
  }

  export type RunUpdateManyWithWhereWithoutBuildInput = {
    where: RunScalarWhereInput
    data: XOR<RunUpdateManyMutationInput, RunUncheckedUpdateManyWithoutBuildInput>
  }

  export type RunScalarWhereInput = {
    AND?: RunScalarWhereInput | RunScalarWhereInput[]
    OR?: RunScalarWhereInput[]
    NOT?: RunScalarWhereInput | RunScalarWhereInput[]
    id?: StringFilter<"Run"> | string
    buildId?: StringFilter<"Run"> | string
    targetUrls?: StringFilter<"Run"> | string
    status?: EnumRunStatusFilter<"Run"> | $Enums.RunStatus
    resultJson?: JsonNullableFilter<"Run">
    error?: StringNullableFilter<"Run"> | string | null
    createdAt?: DateTimeFilter<"Run"> | Date | string
    updatedAt?: DateTimeFilter<"Run"> | Date | string
  }

  export type BuildCreateWithoutRunsInput = {
    id?: string
    userId?: string | null
    targetUrls: string
    userObjective: string
    status?: $Enums.BuildStatus
    error?: string | null
    initialPackageJson?: NullableJsonNullValueInput | InputJsonValue
    sampleResultsJson?: NullableJsonNullValueInput | InputJsonValue
    finalConfigurationJson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BuildUncheckedCreateWithoutRunsInput = {
    id?: string
    userId?: string | null
    targetUrls: string
    userObjective: string
    status?: $Enums.BuildStatus
    error?: string | null
    initialPackageJson?: NullableJsonNullValueInput | InputJsonValue
    sampleResultsJson?: NullableJsonNullValueInput | InputJsonValue
    finalConfigurationJson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type BuildCreateOrConnectWithoutRunsInput = {
    where: BuildWhereUniqueInput
    create: XOR<BuildCreateWithoutRunsInput, BuildUncheckedCreateWithoutRunsInput>
  }

  export type BuildUpsertWithoutRunsInput = {
    update: XOR<BuildUpdateWithoutRunsInput, BuildUncheckedUpdateWithoutRunsInput>
    create: XOR<BuildCreateWithoutRunsInput, BuildUncheckedCreateWithoutRunsInput>
    where?: BuildWhereInput
  }

  export type BuildUpdateToOneWithWhereWithoutRunsInput = {
    where?: BuildWhereInput
    data: XOR<BuildUpdateWithoutRunsInput, BuildUncheckedUpdateWithoutRunsInput>
  }

  export type BuildUpdateWithoutRunsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    targetUrls?: StringFieldUpdateOperationsInput | string
    userObjective?: StringFieldUpdateOperationsInput | string
    status?: EnumBuildStatusFieldUpdateOperationsInput | $Enums.BuildStatus
    error?: NullableStringFieldUpdateOperationsInput | string | null
    initialPackageJson?: NullableJsonNullValueInput | InputJsonValue
    sampleResultsJson?: NullableJsonNullValueInput | InputJsonValue
    finalConfigurationJson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BuildUncheckedUpdateWithoutRunsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    targetUrls?: StringFieldUpdateOperationsInput | string
    userObjective?: StringFieldUpdateOperationsInput | string
    status?: EnumBuildStatusFieldUpdateOperationsInput | $Enums.BuildStatus
    error?: NullableStringFieldUpdateOperationsInput | string | null
    initialPackageJson?: NullableJsonNullValueInput | InputJsonValue
    sampleResultsJson?: NullableJsonNullValueInput | InputJsonValue
    finalConfigurationJson?: NullableJsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RunCreateManyBuildInput = {
    id?: string
    targetUrls: string
    status?: $Enums.RunStatus
    resultJson?: NullableJsonNullValueInput | InputJsonValue
    error?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type RunUpdateWithoutBuildInput = {
    id?: StringFieldUpdateOperationsInput | string
    targetUrls?: StringFieldUpdateOperationsInput | string
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    resultJson?: NullableJsonNullValueInput | InputJsonValue
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RunUncheckedUpdateWithoutBuildInput = {
    id?: StringFieldUpdateOperationsInput | string
    targetUrls?: StringFieldUpdateOperationsInput | string
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    resultJson?: NullableJsonNullValueInput | InputJsonValue
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type RunUncheckedUpdateManyWithoutBuildInput = {
    id?: StringFieldUpdateOperationsInput | string
    targetUrls?: StringFieldUpdateOperationsInput | string
    status?: EnumRunStatusFieldUpdateOperationsInput | $Enums.RunStatus
    resultJson?: NullableJsonNullValueInput | InputJsonValue
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}