import { Mockgoose } from 'mockgoose';
import { MongoError } from 'mongodb';
import { Connection, Mongoose } from 'mongoose';
import { Observable, Observer } from 'rx';

import { IUser, User } from './user.model';

/**
 * Represents a static helper for MongoDB.
 *
 * @export
 * @class MongoDbHelper
 */
export class MongoDbHelper {
    public static readonly validPassword: string = 'P@ssw0rd';
    public static readonly confirmedValidUser: string = 'someone@somewhere.com';
    public static readonly unconfirmedValidUser: string = 'someone-else@somewhere.com';
    public static readonly inactiveValidUser: string = 'someone-not-anymore@somewhere.com';
    public static readonly inactiveUnconfirmedValidUser: string = 'someone-else-not-anymore@somewhere.com';

    private static mockgoose: Mockgoose;

    /**
     * Opens the database connection using the given mongoose client and the given MongoDB URI.
     *
     * @static
     * @param {Mongoose} mongooseClient The mongoose client.
     * @param {string} mongoDbUri The MongoDB URI.
     * @returns {Observable<void>} An observable with no contents that completes when mongoose connects.
     * @memberof App
     */
    public static openDatabaseConnection(mongooseClient: Mongoose, mongoDbUri: string): Observable<void> {
        const result = Observable.create((observer: Observer<void>) => {
            mongooseClient.connect(mongoDbUri, {}).then(() => {
                observer.onCompleted();
            },
                /* istanbul ignore next */
                (err: MongoError) => {
                    observer.onError(err);
                    throw err;
                });

            const mongoDbConnection: Connection = mongooseClient.connection;
            mongoDbConnection.once('connected', () => {
                console.log('Connected to MongoDB.');
            });
            mongoDbConnection.once('error',
                /* istanbul ignore next */
                (err: any) => {
                    console.log(`There was a problem connecting to MongoDB: ${err}`);
                });
            mongoDbConnection.once('disconnected', () => {
                console.log('Disconnected from MongoDB.');
            });
        });

        return result;
    }

    /**
     * Opens a mock database connection using the given mongoose client and the given MongoDB URI.
     *
     * @static
     * @param {Mongoose} mongooseClient The mongoose client.
     * @param {string} mongoDbUri The MongoDB URI.
     * @param {(string | null)} httpProxy The HTTP proxy to be used, if any, for downloading MongoDB for Mockgoose.
     * @returns {Observable<void>} An observable with no contents that completes when mongoose connects.
     * @memberof MongoDbHelper
     */
    public static openMockDatabaseConnection(
        mongooseClient: Mongoose,
        mongoDbUri: string,
        httpProxy: string | null): Observable<void> {
        const result = Observable.create((observer: Observer<void>) => {
            MongoDbHelper.mockgoose = new Mockgoose(mongooseClient);

            /* istanbul ignore next */
            if (httpProxy !== null) {
                MongoDbHelper.mockgoose.helper.setProxy(httpProxy);
            }

            MongoDbHelper.mockgoose.prepareStorage().then(() => {
                MongoDbHelper.openDatabaseConnection(mongooseClient, mongoDbUri).subscribeOnCompleted(() => {
                    observer.onCompleted();
                });
            });
        });

        return result;
    }

    /**
     * Creates mock data to be used when mocking the database connection.
     *
     * @static
     * @returns {Observable<void>} An observable with no contents that completes when the data has been created.
     * @memberof MongoDbHelper
     */
    public static createMockData(): Observable<void> {
        const result: Observable<void> = Observable.create((observer: Observer<void>) => {
            /* istanbul ignore else */
            if (this.mockgoose.helper.isMocked()) {
                User.create(
                    [{
                        email: MongoDbHelper.confirmedValidUser,
                        password: MongoDbHelper.validPassword,
                        fullName: 'Confirmed User',
                        birthday: new Date(2000, 0, 1)
                    },
                    {
                        email: MongoDbHelper.unconfirmedValidUser,
                        password: MongoDbHelper.validPassword,
                        fullName: 'Unconfirmed User',
                        birthday: new Date(2000, 0, 2)
                    },
                    {
                        email: MongoDbHelper.inactiveValidUser,
                        password: MongoDbHelper.validPassword,
                        fullName: 'Inactive User',
                        birthday: new Date(2000, 0, 3)
                    },
                    {
                        email: MongoDbHelper.inactiveUnconfirmedValidUser,
                        password: MongoDbHelper.validPassword,
                        fullName: 'Inactive Unconfirmed User',
                        birthday: new Date(2000, 0, 4)
                    }],
                    (err: any, users: IUser[]) => {
                        /* istanbul ignore if */
                        if (err) {
                            console.log(`There was a problem creating mock users: ${err}`);
                            throw err;
                        }

                        const validUser = users.find((u) => u.email === MongoDbHelper.confirmedValidUser) as IUser;
                        validUser.isEmailConfirmed = true;
                        validUser.save().then(() => {
                            const inactiveUser = users.find((iu) => iu.email === MongoDbHelper.inactiveValidUser) as IUser;
                            inactiveUser.isDeactivated = true;
                            inactiveUser.isEmailConfirmed = true;
                            inactiveUser.save().then(() => {
                                const inactiveUnconfirmedUser = users.find((iuu) =>
                                    iuu.email === MongoDbHelper.inactiveUnconfirmedValidUser) as IUser;
                                inactiveUnconfirmedUser.isDeactivated = true;
                                inactiveUnconfirmedUser.save().then(() => {
                                    observer.onCompleted();
                                });
                            });
                        });
                    });
            }
        });

        return result;
    }

    /**
     * Resets the mock data.
     *
     * @static
     * @returns {Observable<void>} An observable with no contents that completes when the data has been reset.
     * @memberof MongoDbHelper
     */
    public static resetMockData(): Observable<void> {
        const result: Observable<void> = Observable.create((observer: Observer<void>) => {
            MongoDbHelper.mockgoose.helper.reset().then(() => {
                observer.onCompleted();
            });
        });

        return result;
    }
}
