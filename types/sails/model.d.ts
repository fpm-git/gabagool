
// Why is everything abstract? Two reasons:
//    - keep (some) IDEs from suggesting constructors for classes
//    - allow this file to remain free of syntax errors without the .d. extension prefix

abstract class ModelDatastore {

  name: string;

  config: any;

  /**
   * The generic, stateless, low-level driver for this datastore (if the adapter supports it).
   *
   * This property is not guaranteed to exist for all database adapters. If the datastore's underlying
   * adapter does not support the standardized driver interface, then driver will not exist.
   */
  driver: any;

  /**
   * The live connection manager for this datastore.
   *
   * Depending on the adapter, this might represent a connection pool, a single connection, or even just
   * a reference to a pre-configured client library instance.
   */
  manager: any;

  /**
   * Lease a new connection from the datastore for use in running multiple queries on the same connection
   * (i.e. so that the logic provided in during can reuse the db connection).
   *
   * @param during - A callback which Sails will call automatically when a connection has been obtained and
   * made ready for you.
   */
  abstract leaseConnection(during: (db: any, proceed: (err?: any, res?: any) => void) => any): Promise<any>;

  /**
   * Execute a raw SQL query using this datastore.
   *
   * This function is only available on Sails/Waterline datastores that are configured to use a SQL database
   * (e.g. PostgreSQL or MySQL). Note that exact SQL and result format varies between databases, so you'll
   * need to refer to the documentation for your underlying database adapter. (See below for a simple example
   * to help get you started.)
   *
   * @param sql - A SQL string written in the appropriate dialect for this database. Allows template syntax
   * like $1, $2, etc. If you are using custom table names or column names, be sure to reference those directly
   * (rather than model identities and attribute names).
   * @param valuesToEscape - 	An array of dynamic, untrusted strings to SQL-escape and inject within sql.
   * (If you have no dynamic values to inject, then just omit this argument or pass in an empty array here.)
   */
  abstract sendNativeQuery(sql: string, valuesToEscape?: any[]): Promise<any>;

  /**
   * Fetch a preconfigured deferred object hooked up to the sails-mysql or sails-postgresql adapter (and
   * consequently the appropriate driver).
   */
  abstract transaction(during: (db: any, proceed: (err?: any, res?: any) => void) => any): Promise<any>;

}

abstract class ModelQueryChain<T, X> extends Promise<X> {

  /**
   * Decrypt any auto-encrypted attributes in the records returned for this particular query.
   */
  abstract decrypt(): this;

  /**
   * Execute a Waterline query instance.
   *
   * @param callback - The Node-style callback that will be called when the query completes;
   * successfully or otherwise.
   *
   * @deprecated as of Sails v1 and Node.js v8; please use await instead.
   */
  abstract exec(callback: (err?: Error, result?: X) => any): void;

  /**
   * Tell Waterline (and the underlying database adapter) to send back records that were updated/destroyed/created
   * when performing an .update(), .create(), .createEach() or .destroy() query. Otherwise, no data will be returned
   * (or if you are using callbacks, the second argument to the .exec() callback will be undefined.)
   *
   * Warning: this is not recommended for update/destroy queries that affect large numbers of records.
   */
  abstract fetch(): ModelQueryChain<T, T>;

  /**
   * Capture and intercept the specified error, automatically modifying and re-throwing it, or specifying
   * a new Error to be thrown instead. (Still throws.)
   */
  abstract intercept(filter: string | Object | ((err: Error) => any), handler?: ((err: Error) => any) | string): this;

  /**
   * Set the maximum number of records to retrieve when executing a query instance.
   *
   * @param maximum - The maximum number of records to retrieve.
   */
  abstract limit(maximum: number): this;

  /**
   * Provide additional options to Waterline when executing a query instance.
   *
   * @param options - A dictionary (plain JS object) of options. See all supported options (aka “meta keys”)
   * at: https://next.sailsjs.com/documentation/reference/waterline-orm/queries/meta.
   */
  abstract meta(options: Object): this;

  /**
   * Modify a query instance so that, when executed, it will populate child records for the specified collection,
   * optionally filtering by subcriteria. Populate may be called more than once on the same query, as long as each
   * call is for a different association.
   *
   * @param association - The name of the association to populate. e.g. snacks.
   * @param subcriteria - Optional. When populating collection associations between two models which reside in the
   * same database, a Waterline criteria may be specified as a second argument to populate. This will be used for
   * filtering, sorting, and limiting the array of associated records (e.g. snacks) associated with each primary record.
   */
  abstract populate(association: string, subcriteria?: Object): this;

  /**
   * Indicate a number of records to skip before returning the results from executing a query instance.
   *
   * @param numRecordsToSkip - The number of records to skip.
   */
  abstract skip(numRecordsToSkip: number): this;

  /**
   * Set the order in which retrieved records should be returned when executing a query instance.
   * The “sort clause“ can be specified as either a string or an array of dictionaries.
   *
   * @param sortClause - If specified as a string, this should be formatted as: an attribute name, followed by a space,
   * followed by either ASC or DESC to indicate an ascending or descending sort (e.g. name ASC).
   *
   * If specified as an array, then each array item should be a dictionary with a single key representing the attribute
   * to sort by, whose value is either ASC or DESC. The array syntax allows for sorting by multiple attributes, using the
   * array order to establish precedence (e.g. [ { name: 'ASC' }, { age: 'DESC'} ]).
   */
  abstract sort(sortClause: string | Object[]): this;

  /**
   * Tolerate (swallow) the specified error, and return a new result value (or undefined) instead. (Don't throw.)
   */
  abstract tolerate(filter: string | Object | ((err: Error) => any), handler?: ((err: Error) => any) | string): this;

  /**
   * Begin executing a Waterline query instance and return a promise.
   *
   * This is an alternative to .exec().
   */
  abstract toPromise(): Promise<X>;

  /**
   * Specify an existing database connection to use for this query.
   *
   * @param connection - An existing database connection obtained using .transaction() or .leaseConnection().
   */
  abstract usingConnection(connection: any): this;

  /**
   * Specify a where clause for filtering a query.
   *
   * This method can be chained to .find() to further filter your results.
   *
   * @param whereClause - The where clause to use for matching records in the database.
   */
  abstract where(whereClause: Object): this;

};

abstract class ModelMembersQueryChain<T> extends ModelQueryChain<T, T> {

  /**
   * Specifies separately the childIds parameter of a collection call.
   */
  abstract members(childIds: (number | string)[]): this;

}

abstract class ModelWasCreatedExecQueryChain<T> extends ModelQueryChain<T, T> {

  /**
   * Execute a Waterline query instance.
   *
   * @param callback - The Node-style callback that will be called when the query completes;
   * successfully or otherwise.
   */
  abstract exec(callback: (err?: Error, newOrExistingRecord?: T, wasCreated?: boolean) => any): void;

}

abstract class ModelStreamableQueryChain<T> extends ModelQueryChain<T, T> {

  /**
   * Begins a callback flow used to process streamed-in records one at a time.
   *
   * If at any point the next callback is called with a truthy first argument (typically an Error instance),
   * then Waterline understands that to mean an error occurred, and that it should stop processing records.
   * Otherwise, it is assumed that everything went according to plan.
   */
  abstract eachRecord(callback: (record: T, next: (err?: any) => void) => any): void;

  /**
   * Begins a callback flow used to process streamed-in records in batches of at least 1 and no more than 30.
   *
   * If at any point the next callback is called with a truthy first argument (typically an Error instance),
   * then Waterline understands that to mean an error occurred, and that it should stop processing batches.
   * Otherwise, it is assumed that everything went according to plan.
   */
  abstract eachBatch(callback: (batch: T[], next: (err?: any) => void) => any): void;

}

declare abstract class $ailsModelPubSub<T> {

  /**
   * Retrieve the name of the PubSub “room” for a given record.
   *
   * @param id - The ID (primary key value) of the record to get the PubSub room name for.
   */
  abstract getRoomName(id: number | string): string;

  /**
   * Broadcast an arbitrary message to socket clients subscribed to one or more of this model's records.
   *
   * The event name for this broadcast is the same as the model's identity.
   *
   * @param ids - An array of record ids (primary key values).
   * @param data - The data to broadcast.
   * @param req - Optional. If provided, then the requesting socket will not receive the broadcast.
   */
  abstract publish(ids: (number | string)[], data: Object, req?: any): void;

  /**
   * Subscribe the requesting client socket to changes/deletions of one or more database records.
   *
   * When a client socket is subscribed to a record, it is a member of its dynamic "record room".
   * That means it will receive all messages broadcasted to that room by .publish().
   *
   * @param req - The incoming socket request (req) containing the socket to subscribe.
   * @param ids - An array of record ids (primary key values).
   */
  abstract subscribe(req: any, ids: (number | string)[]): void;

  /**
   * Unsubscribe the requesting client socket from one or more database records.
   *
   * @param req - The incoming socket request (req) containing the socket to unsubscribe.
   * @param ids - An array of record ids (primary key values).
   */
  abstract unsubscribe(req: any, ids: (number | string)[]): void;

}

export declare abstract class $ailsModel<T> extends $ailsModelPubSub<T> {

  tableName: string;

  /**
   * Add one or more existing child records to the specified collection (e.g. the comments of BlogPost #4).
   *
   * @param parentId - The primary key value(s) (i.e. ids) for the parent record(s).
   * Must be a number or string (e.g. '507f191e810c19729de860ea' or 49).
   * Alternatively, an array of numbers or strings may be specified (e.g. ['507f191e810c19729de860ea', '14832ace0c179de897']
   * or [49, 32, 37]). In this case, all of the child records will be added to the appropriate collection of each parent record.
   *
   * @param association - The name of the plural ("collection") association (e.g. "pets").
   *
   * @param childIds - The primary key values (i.e. ids) of the child records to add. Note that this does not
   * create these child records, it just links them to the specified parent(s).
   *
   * These values may alternatively be specified with the .members() chain function instead.
   */
  abstract addToCollection(parentId: number | string, association: string, childIds?: (number | string)[]): ModelMembersQueryChain<T[]>;

  /**
   * Archive ("soft-delete") records that match the specified criteria, saving them as new records in the
   * built-in Archive model, then destroying the originals.
   *
   * Note: the archived records are not provided to the chain callback by default. If you wish to receive
   * these values, make sure to chain a .fetch() call.
   *
   * @param criteria - Records which match this Waterline criteria will be archived. Be warned, if you specify
   * an empty dictionary ({}) as your criteria, all records will be destroyed!
   */
  abstract archive(criteria: Object): ModelQueryChain<T[], void>;

  /**
   * Get the aggregate mean of the specified attribute across all matching records.
   *
   * @param numericAttrName - The name of the numeric attribute whose mean will be calculated.
   * @param criteria - The Waterline criteria to use for matching records in the database. If no criteria is
   * specified, the average will be computed across all of this model's records. avg queries do not support
   * pagination using skip and limit or projections using select.
   */
  abstract avg(numericAttrName: string, criteria?: Object): ModelQueryChain<number, number>;

  /**
   * Get the total number of records matching the specified criteria.
   *
   * @param criteria - The Waterline criteria to use for matching records in the database. Note that count
   * queries do not support pagination using skip and limit or projections using select.
   */
  abstract count(criteria?: Object): ModelQueryChain<number, number>;

  /**
   * Create a record in the database.
   *
   * Note: For improved performance, the created record is not provided as a result by default. But if you chain
   * .fetch(), then the newly-created record will be sent back. (Be aware that this requires an extra database
   * query in some adapters.)
   *
   * @param initialValues - The initial values for the new record. (Note that, if this model is in "schemaful"
   * mode, then any extraneous keys will be silently omitted.)
   */
  abstract create(initialValues: Object): ModelQueryChain<T, void>;

  /**
   * Create a set of records in the database.
   *
   * Note: For improved performance, the created records are not provided as a result by default. But if you chain
   * .fetch(), then the newly-created records will be sent back. (Be aware that this requires an extra database
   * query in some adapters.)
   *
   * @param initialValues - An array of dictionaries with attributes for the new records.
   */
  abstract createEach(initialValues: Object[]): ModelQueryChain<T[], void>;

  /**
   * Destroy records in your database that match the given criteria.
   *
   * Note: For improved performance, the destroyed records are not provided as a result by default. But if you chain
   * .fetch(), then the destroyed records will be sent back. (Be aware that this requires an extra database query in
   * some adapters.)
   *
   * @param criteria - Records which match this Waterline criteria will be destroyed. Be warned, if you specify an
   * empty dictionary ({}) as your criteria, all records will be destroyed! destroy queries do not support pagination
   * using skip and limit or projections using select.
   */
  abstract destroy(criteria: Object): ModelQueryChain<T[], void>;

  /**
   * Find records in your database that match the given criteria.
   *
   * @param criteria - The Waterline criteria to use for matching records in the database.
   */
  abstract find(criteria: Object): ModelQueryChain<T[], T[]>;

  /**
   * Attempt to find a particular record in your database that matches the given criteria.
   *
   * @param criteria - The Waterline criteria to use for matching this record in the database. (This criteria must
   * never match more than one record.)
   *
   * findOne queries do not support pagination using skip or limit.
   */
  abstract findOne(criteria: Object): ModelQueryChain<T | void, T | void>;

  /**
   * Find the record matching the specified criteria. If no such record exists, create one using the provided
   * initial values.
   *
   * @param criteria - The Waterline criteria to use for matching records in the database. This particular
   * criteria should always match exactly zero or one records in the database.
   * @param initialValues - The initial values for the new record, if one is created.
   */
  abstract findOrCreate(criteria: Object, initialValues: Object): ModelWasCreatedExecQueryChain<T>;

  /**
   * Access the datastore for a particular model.
   */
  abstract getDatastore(): ModelDatastore;

  /**
   * Remove one or more members (e.g. a comment) from the specified collection (e.g. the comments of BlogPost #4).
   *
   * @param parentId - The primary key value(s) (i.e. ids) for the parent record(s).
   * Must be a number or string (e.g. '507f191e810c19729de860ea' or 49).
   * Alternatively, an array of numbers or strings may be specified (e.g. ['507f191e810c19729de860ea', '14832ace0c179de897']
   * or [49, 32, 37]). In this case, all of the child records will be removed from the appropriate collection of each parent record.
   *
   * @param association - The name of the plural ("collection") association (e.g. "pets").
   *
   * @param childIds - The primary key values (i.e. ids) of the child records to remove. Note that this does not
   * destroy these records, it just detaches them from the specified parent(s).
   *
   * These values may alternatively be specified with the .members() chain function instead.
   */
  abstract removeFromCollection(parentId: number | string, association: string, childIds?: (number | string)[]): ModelMembersQueryChain<T>;

  /**
   * Replace all members of the specified collection (e.g. the comments of BlogPost #4).
   *
   * @param parentId - The primary key value(s) (i.e. ids) for the parent record(s).
   * Must be a number or string (e.g. '507f191e810c19729de860ea' or 49).
   * Alternatively, an array of numbers or strings may be specified (e.g. ['507f191e810c19729de860ea', '14832ace0c179de897']
   * or [49, 32, 37]). In this case, the child records will be replaced in each parent record.
   *
   * @param association - The name of the plural ("collection") association (e.g. "pets").
   *
   * @param childIds - The primary key values (i.e. ids) for the child records that will be the new members of the
   * association. Note that this does not create these records or destroy the old ones, it just attaches/detaches
   * records to/from the specified parent(s).
   */
  abstract replaceCollection(parentId: number | string, association: string, childIds?: (number | string)[]): ModelMembersQueryChain<T>;

  /**
   * Stream records from your database one at a time or in batches, without first having to buffer the entire result set in memory.
   *
   * @param criteria - The Waterline criteria to use for matching records in the database.
   */
  abstract stream(criteria: Object): ModelStreamableQueryChain<T>;

  /**
   * Get the aggregate sum of the specified attribute across all matching records.
   *
   * @param numericAttrName - The name of the numeric attribute that will be totaled up.
   * @param criteria - The Waterline criteria to use for matching records in the database. If no criteria is
   * specified, the sum will be computed across all of this model's records. sum queries do not support pagination
   * using skip and limit or projections using select.
   */
  abstract sum(numericAttrName: number, criteria?: Object): ModelQueryChain<number, number>;

  /**
   * Update all records matching the given criteria.
   *
   * Note: By default, for better performance, the updated records are not provided as a result. But if you
   * chain .fetch(), then the array of updated record(s) will be sent back. (Be aware that this requires extra
   * database queries in some adapters.)
   *
   * @param criteria - The Waterline criteria to use for matching records in the database. update queries do
   * not support pagination using skip and limit or projections using select.
   * @param valuesToSet - A dictionary (plain JavaScript object) of values to that all matching records should
   * be updated to have. (Note that, if this model is in "schemaful" mode, then any extraneous keys will be
   * silently omitted.)
   */
  abstract update(criteria: Object, valuesToSet: Object): ModelQueryChain<T[], void>;

}
