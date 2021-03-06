import { NextFunction, Request, Response } from 'express';

import { BaseController } from '../core/base.controller';
import { HttpVerbs } from '../core/http-verbs.enum';
import { IStandardResponse } from '../core/standard-response';
import { IUser } from '../core/user.model';
import { IJwtAuthenticationService } from './jwt-authentication.service.d';
import { LogOnInfo } from './logOnInfo.model';
import { ILogOnResult } from './logOnResult';
import { ISession } from './session.model';

/**
 * Represents a session controller.
 *
 * @export
 * @class SessionController
 * @extends {BaseController}
 */
export class SessionController extends BaseController {
    private authenticationService: IJwtAuthenticationService;

    /**
     * Creates an instance of SessionController.
     *
     * @param {IJwtAuthenticationService} authenticationService The authentication service.
     * @memberof SessionController
     */
    constructor(authenticationService: IJwtAuthenticationService) {
        super('/session', 1);
        this.authenticationService = authenticationService;

        this.routes.push(
            {
                path: this.defaultPath,
                handler: this.postSession,
                verbs: [HttpVerbs.POST],
                isAnonymous: true
            }, {
                path: this.defaultPath,
                handler: this.getSession,
                verbs: [HttpVerbs.GET],
                isAnonymous: false
            }, {
                path: this.defaultPath,
                handler: this.deleteSession,
                verbs: [HttpVerbs.DELETE],
                isAnonymous: false
            });
    }

    /**
     * Creates a new entry in the sessions collection, authenticating a user.
     *
     * @param {Request} req The HTTP request that should contain in its body an emailAddress and password.
     * @param {Response} res The HTTP response.
     * @param {NextFunction} next The next function in the pipeline.
     * @memberof SessionController
     */
    public postSession(req: Request, res: Response, next: NextFunction): void {
        const logOnInfo: LogOnInfo = new LogOnInfo(req.body.emailAddress, req.body.password);

        this.authenticationService.logOn(logOnInfo).subscribe((logOnResult: ILogOnResult | null) => {
            const result: IStandardResponse = {
                success: logOnResult !== null,
                message: logOnResult !== null ?
                    'You have been successfully authenticated.' :
                    'Authentication failed. E-mail address or password incorrect.',
                data: logOnResult !== null ? { token: logOnResult.token, profileId: logOnResult.profileId } : undefined
            };

            res.statusCode = result.success ? 201 : 401;
            res.json(result);
        });
    }

    /**
     * Gets the currently authenticated session if any.
     *
     * @param {Request} req The HTTP request.
     * @param {Response} res The HTTP response.
     * @param {NextFunction} next The next function in the pipeline.
     * @memberof SessionController
     */
    public getSession(req: Request, res: Response, next: NextFunction): void {
        const user: IUser = req.user as IUser;
        const result: ISession = {
            profileId: user.id,
            email: user.email,
            fullName: user.fullName
        };

        const response: IStandardResponse = {
            success: true,
            data: result
        };

        res.statusCode = 200;
        res.json(response);
    }

    /**
     * Deletes the currently authenticated session if any, logging off a user.
     *
     * @param {Request} req The HTTP request.
     * @param {Response} res The HTTP response.
     * @param {NextFunction} next The next function in the pipeline.
     * @memberof SessionController
     */
    public deleteSession(req: Request, res: Response, next: NextFunction): void {
        const user: IUser = req.user as IUser;
        this.authenticationService.logOut(user, req.authInfo).subscribe((success: boolean) => {
            res.statusCode = success ? 200 : 500;
            const response: IStandardResponse = {
                success,
                message: success ? 'You have been successfully logged out.' : 'You have not been logged out.'
            };

            res.json(response);
        }, (err: any) => {
            res.statusCode = 500;
            const response: IStandardResponse = {
                success: false,
                message: 'There was a problem logging you out.',
                data: err
            };

            res.json(response);
        });
    }
}
