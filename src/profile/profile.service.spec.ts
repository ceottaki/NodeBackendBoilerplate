// tslint:disable:max-line-length
import { Mockgoose } from 'mockgoose';
import * as mongoose from 'mongoose';
import { Observable } from 'rx';

import { MongoDbHelper } from '../core/mongo-db-helper';
import { IUser, User } from '../core/user.model';
import { ProfileFailureReasons } from './profile-failure-reasons.enum';
import { ProfileService } from './profile.service';

// This is a requirement of Mongoose to set which promise framework it will use.
(mongoose as any).Promise = global.Promise;

let originalJasmineTimeout: number;

const newValidUserEmail: string = 'thatperson@somewhere.com';

describe('Profile Service', () => {
    beforeAll((done) => {
        // Jasmine's timeout needs to be increased a lot because when running the tests for the first time...
        // ...MongoDB will be downloaded by Mockgoose to allow mocking to happen.
        originalJasmineTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;

        // Sets up a mocked instance of MongoDB to be used through Mongoose.
        MongoDbHelper.openMockDatabaseConnection(
            mongoose,
            'mongodb://localhost/boilerplate',
            process.env.HTTP_PROXY !== undefined ? process.env.HTTP_PROXY as string : null)
            .subscribeOnCompleted(() => {
                // Creates the mocked users that can be used during tests.
                MongoDbHelper.createMockData().subscribeOnCompleted(() => {
                    done();
                });
            });
    });

    beforeEach((done) => {
        done();
    });

    afterEach((done) => {
        done();
    });

    afterAll((done) => {
        // Sets Jasmine's default timeout back to the original one.
        jasmine.DEFAULT_TIMEOUT_INTERVAL = originalJasmineTimeout;

        // Resets the mocked database, deleting all users and any other entries.
        MongoDbHelper.resetMockData().subscribeOnCompleted(() => {
            // Closes the mocked database connection.
            mongoose.connection.close().then(() => {
                done();
            });
        });
    });

    it('should instantiate correctly', (done) => {
        const service = new ProfileService();
        expect(service).toBeTruthy();
        done();
    });

    it('should create a new profile successfully when given valid information', (done) => {
        const service = new ProfileService();
        const reasons: ProfileFailureReasons[] = new Array<ProfileFailureReasons>();
        service.createNewProfile({
            email: newValidUserEmail,
            password: MongoDbHelper.validPassword,
            fullName: 'That Person',
            birthday: new Date(2000, 0, 1)
        } as IUser).subscribe((reason: ProfileFailureReasons) => {
            reasons.push(reason);
        }, (error: any) => {
            fail(error);
            done();
        }, () => {
            expect(reasons[0] === ProfileFailureReasons.NONE && reasons.length === 1).toBe(true);
            done();
        });
    });

    it('should fail with a reason of duplicate e-mail when trying to register a profile with an existing active and confirmed e-mail address', (done) => {
        const service = new ProfileService();
        const reasons: ProfileFailureReasons[] = new Array<ProfileFailureReasons>();

        service.createNewProfile({
            email: MongoDbHelper.confirmedValidUser,
            password: MongoDbHelper.validPassword,
            fullName: 'That Person',
            birthday: new Date(2000, 0, 1)
        } as IUser).subscribe((reason: ProfileFailureReasons) => {
            reasons.push(reason);
        }, (error: any) => {
            fail(error);
            done();
        }, () => {
            expect(reasons[0] === ProfileFailureReasons.DUPLICATE_EMAIL && reasons.length === 1).toBe(true);
            done();
        });
    });

    it('should fail with two reasons for duplicate and unconfirmed e-mail when trying to register a profile with an existing unconfirmed e-mail address', (done) => {
        const service = new ProfileService();
        const reasons: ProfileFailureReasons[] = new Array<ProfileFailureReasons>();

        service.createNewProfile({
            email: MongoDbHelper.unconfirmedValidUser,
            password: MongoDbHelper.validPassword,
            fullName: 'That Person',
            birthday: new Date(2000, 0, 1)
        } as IUser).subscribe((reason: ProfileFailureReasons) => {
            reasons.push(reason);
        }, (error: any) => {
            fail(error);
            done();
        }, () => {
            expect(
                reasons.indexOf(ProfileFailureReasons.DUPLICATE_EMAIL) >= 0
                && reasons.indexOf(ProfileFailureReasons.UNCONFIRMED_EMAIL) >= 0
                && reasons.length === 2).toBe(true);
            done();
        });
    });

    it('should fail with two reasons for duplicate e-mail and deactivated profile when trying to register a profile with an existing deactivated profile', (done) => {
        const service = new ProfileService();
        const reasons: ProfileFailureReasons[] = new Array<ProfileFailureReasons>();

        service.createNewProfile({
            email: MongoDbHelper.inactiveValidUser,
            password: MongoDbHelper.validPassword,
            fullName: 'That Person',
            birthday: new Date(2000, 0, 1)
        } as IUser).subscribe((reason: ProfileFailureReasons) => {
            reasons.push(reason);
        }, (error: any) => {
            fail(error);
            done();
        }, () => {
            expect(
                reasons.indexOf(ProfileFailureReasons.DUPLICATE_EMAIL) >= 0
                && reasons.indexOf(ProfileFailureReasons.INACTIVE_PROFILE) >= 0
                && reasons.length === 2).toBe(true);
            done();
        });
    });

    it('should fail with three reasons for duplicate and unconfirmed e-mail and deactivated profile when trying to register a profile wiht an existing unconfirmed deactivated profile', (done) => {
        const service = new ProfileService();
        const reasons: ProfileFailureReasons[] = new Array<ProfileFailureReasons>();

        service.createNewProfile({
            email: MongoDbHelper.inactiveUnconfirmedValidUser,
            password: MongoDbHelper.validPassword,
            fullName: 'That Person',
            birthday: new Date(2000, 0, 1)
        } as IUser).subscribe((reason: ProfileFailureReasons) => {
            reasons.push(reason);
        }, (error: any) => {
            fail(error);
            done();
        }, () => {
            expect(
                reasons.indexOf(ProfileFailureReasons.DUPLICATE_EMAIL) >= 0
                && reasons.indexOf(ProfileFailureReasons.INACTIVE_PROFILE) >= 0
                && reasons.indexOf(ProfileFailureReasons.UNCONFIRMED_EMAIL) >= 0
                && reasons.length === 3).toBe(true);
            done();
        });
    });

    it('should fail with a reason of missing required field when trying to register with incomplete information', (done) => {
        const service = new ProfileService();
        const reasons: ProfileFailureReasons[] = new Array<ProfileFailureReasons>();

        service.createNewProfile({
            email: MongoDbHelper.inactiveUnconfirmedValidUser,
            password: MongoDbHelper.validPassword,
            fullName: 'That Person'
        } as IUser).subscribe((reason: ProfileFailureReasons) => {
            reasons.push(reason);
        }, (error: any) => {
            fail(error);
            done();
        }, () => {
            expect(
                reasons.indexOf(ProfileFailureReasons.MISSING_REQUIRED) >= 0 && reasons.length === 1).toBe(true);
            done();
        });
    });
});