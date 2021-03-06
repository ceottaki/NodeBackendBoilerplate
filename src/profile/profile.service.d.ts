import { Observable } from 'rx';

import { IUser } from '../core/user.model';
import { ProfileFailureReasons } from './profile-failure-reasons.enum';

/**
 * Defines properties and methods for an implementation of a profile service.
 *
 * @export
 * @interface IProfileService
 */
export interface IProfileService {
    /**
     * When implemented it should create a new user profile with the given information.
     *
     * @param {IUser} user The user profile to be created.
     * @returns {Observable<ProfileFailureReasons | string>} An observable with reasons for failure to create a profile or its id string.
     * @memberof IProfileService
     */
    createNewProfile(user: IUser): Observable<ProfileFailureReasons | string>;

    /**
     * When implemented it should update an existing user profile with the given profile.
     *
     * @param {string} profileId The id of the user profile to be updated.
     * @param {*} changes An object with the properties to be changed in a user profile.
     * @returns {Observable<ProfileFailureReasons>} An observable with possible reasons for failure to update a profile.
     * @memberof IProfileService
     */
    updateProfile(profileId: string, changes: any): Observable<ProfileFailureReasons>;

    /**
     * When implemented it should deactivate the given existing user profile.
     *
     * @param {string} profileId The id of the user profile to be deactivated.
     * @returns {Observable<ProfileFailureReasons>} An observable with possible reasons for failure to deactive a profile.
     * @memberof IProfileService
     */
    deactivateProfile(profileId: string): Observable<ProfileFailureReasons>;

    /**
     * When implemented it should clean a given profile for presentation to client-side,
     * removing sensitive information such as encrypted passwords.
     *
     * @param {IUser} user The user profile to be cleaned.
     * @returns {object} The cleaned user profile.
     * @memberof IProfileService
     */
    cleanProfileForClient(user: IUser): any;

    /**
     * When implemented it should set the e-mail confirmed flag of the profile with the given e-mail address to true
     * if the given confirmation token matches the e-mail confirmation token of that profile.
     *
     * @param {string} emailAddress The e-mail address of the profile to be confirmed.
     * @param {string} confirmationToken The confirmation token to match to the profile to be confirmed.
     * @returns {Observable<ProfileFailureReasons>} An observable with possible reasons for failure to confirm the e-mail address.
     * @memberof IProfileService
     */
    confirmProfileEmailAddress(emailAddress: string, confirmationToken: string): Observable<ProfileFailureReasons>;
}
