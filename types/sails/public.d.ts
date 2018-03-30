/**
 * @file public.d.ts
 * A collection of public types to be used only for parameter and return value declarations.
 *
 * The types defined here are not meant to be instantiable or globally defined values at all
 * accessible during runtime. These are included only to aid with development through code-
 * insight features provided by some IDEs.
 */

declare interface CookieOptions {

    /**
     * Domain name for the cookie. Defaults to the domain name of the app.
     */
    domain?: string;

    /**
     * A synchronous function used for cookie value encoding. Defaults to encodeURIComponent.
     */
    encode?: (value: any) => any;

    /**
     * Expiry date of the cookie in GMT. If not specified or set to 0, creates a session cookie.
     */
    expires?: Date;

    /**
     * Flags the cookie to be accessible only by the web server.
     */
    httpOnly?: boolean;

    /**
     * Convenient option for setting the expiry time relative to the current time in milliseconds.
     */
    maxAge?: number;

    /**
     * Path for the cookie. Defaults to “/”.
     */
    path?: string;

    /**
     * Marks the cookie to be used with HTTPS only.
     */
    secure?: boolean;

    /**
     * Indicates if the cookie should be signed.
     */
    signed?: boolean;

    /**
     * Value of the “SameSite” Set-Cookie attribute.
     * More information at https://tools.ietf.org/html/draft-ietf-httpbis-cookie-same-site-00#section-4.1.1.
     */
    sameSite?: boolean | string;

}

export abstract class SailsRequest {

    /**
     * Contains an array of the "media types" this request (req) can accept (e.g. text/html or
     * application/json), ordered from highest to lowest quality.
     */
    accepted?: string[];

    /**
     * This property is an array that contains the acceptable charsets specified by the user agent
     * in the request.
     */
    acceptedCharsets?: string[];

    /**
     * An array containing the "acceptable" response languages specified by the user agent in the
     * "Accept-Language" header of this request (req).
     */
    acceptedLanguages?: string[];

    /**
     * An object containing text parameters from the parsed request body, defaulting to {}.
     *
     * By default, the request body can be url-encoded or stringified as JSON. Support for other
     * formats, such as serialized XML, is possible using the middleware configuration.
     *
     * Notes:
     *  - If a request contains one or more file uploads, only the text parameters sent before
     *    the first file parameter will be available in req.body.
     *  - When using the default Skipper body parser, this property will be undefined for GET
     *    requests.
     *
     * @default {}
     */
    body?: { [paramName: string]: any };

    /**
     * An object containing all of the unsigned cookies from this request (req).
     */
    cookies?: { [cookieName: string]: any };

    /**
     * A flag indicating the user-agent sending this request (req) wants "fresh" data (as indicated
     * by the "if-none-match", "cache-control", and/or "if-modified-since" request headers.)
     *
     * If the request wants "fresh" data, usually you'll want to .find() fresh data from your
     * models and send it back to the client.
     */
    fresh: boolean;

    /**
     * An object containing pre-defined/custom headers given in the current request.
     */
    headers: { [headerName: string]: string };

    /**
     * The hostname of this request, without the port number, as specified by its "Host" header.
     */
    host: string;

    /**
     * The IP address of the client who sent this request (req).
     */
    ip: string;

    /**
     * If sails.config.http.trustProxy is enabled, this variable contains the IP addresses
     * in this request's "X-Forwarded-For" header as an array of the IP address strings.
     * Otherwise an empty array is returned.
     */
    ips: string[];

    /**
     * A flag indicating whether or not this request (req) originated from a Socket.io connection.
     */
    isSocket: boolean;

    /**
     * The HTTP request method (aka "verb".)
     */
    method: string;

    /**
     * A dictionary (plain JavaScript object) of request-agnostic settings available in your
     * app's actions.
     *
     * The purpose of this field is to allow an action's code to access its configured route
     * options, if there are any.
     *
     * (Simply put: "route options" are just any additional properties provided in a route target.)
     */
    options: Object;

    /**
     * From the Express docs: This property is much like req.url; however, it retains the original
     * request URL, allowing you to rewrite req.url freely for internal routing purposes.
     *
     * In almost all cases, you’ll want to use req.url instead. In the rare cases where req.url
     * is modified (for example, inside of a policy or middleware in order to redirect to an
     * internal route), req.originalUrl will give you the URL that was originally requested.
     */
    originalUrl: string;

    /**
     * An object containing parameter values parsed from the URL path.
     *
     * For example if you have the route /user/:name, then the "name" from the URL path wil be
     * available as req.params.name. This object defaults to {}.
     *
     * @default {}
     */
    params: { [paramName: string]: any };

    /**
     * The URL pathname from the request URL string of the current request (req).
     *
     * Note that this is the part of the URL after and including the leading slash (e.g. /foo/bar),
     * but without the query string (e.g. ?name=foo) or fragment (e.g. #foobar.)
     */
    path: string;

    /**
     * The protocol used to send this request (req).
     */
    protocol: string;

    /**
     * A dictionary containing the parsed query-string, defaulting to {}.
     *
     * @default {}
     */
    query: { [paramName: string]: any };

    /**
     * Indicates whether or not the request was sent over a secure TLS connection (i.e. https://
     * or wss://).
     */
    secure: boolean;

    /**
     * A dictionary containing all the signed cookies from the request object.
     *
     * A signed cookie is protected against modification by the client. This protection is
     * provided by a base64 encoded HMAC of the cookie value.
     *
     * When retrieving the cookie, if the HMAC signature does not match based on the cookie's
     * value, then the cookie is not available as a member of the req.signedCookies object.
     */
    signedCookies: { [cookieName: string]: any };

    /**
     * If the current Request (req) originated from a connected Socket.io client, req.socket
     * refers to the raw Socket.io socket instance.
     *
     * @deprecated req.socket may be deprecated in a future release of Sails. You should use
     * the sails.sockets.* methods instead.
     */
    socket?: any;

    /**
     * An array of all the subdomains in this request's URL.
     */
    subdomains: string[];

    /**
     * Like req.path, but also includes the query string suffix.
     */
    url: string;

    /**
     * A flag indicating whether the requesting client would prefer a JSON response (as opposed
     * to some other format, like XML or HTML.)
     *
     * req.wantsJSON is used by all of the built-in custom responses in Sails.
     */
    wantsJSON: boolean;

    /**
     * A flag indicating whether the current request (req) appears to be an AJAX request (i.e. it
     * was issued with its "X-Requested-With" header set to "XMLHttpRequest".)
     */
    xhr: boolean;

    /**
     * Checks whether this request's stated list of "accepted" media types includes the specified type.
     *
     * @param mediaType - The type that should be checked against this request's Accept header.
     *
     * @returns true or false depending on whether or not the request indicates support for
     * the specified type media type.
     */
    abstract accepts(mediaType: string): boolean;

    /**
     * Returns whether this request (req) is able to handle a specified characterSet.
     *
     * @param characterSet - The character set identifier to check for against the request's
     * Accept-Charset header.
     *
     * @returns true or false depending on whether or not the request indicates support for
     * the specified charset.
     */
    abstract acceptsCharset(characterSet: string): boolean;

    /**
     * Returns whether this request (req) considers a certain language "acceptable".
     *
     * @param language - The IETF language tag to check for support against.
     *
     * @returns true or false depending on whether or not the request headers indicate support
     * for the specified language type.
     */
    abstract acceptsLanguage(language: string): boolean;

    /**
     * Returns the value of all parameters sent in the request, merged together into a single
     * dictionary (plain JavaScript object).
     *
     * Includes parameters parsed from the url path, the request body and the query string in
     * that order. See req.param() for details.
     */
    abstract allParams(): { [paramName: string]: any };

    /**
     * Build and return a Skipper Upstream representing an incoming multipart file upload from
     * the specified field.
     *
     * @param field - Name of the file field within this multipart request's content.
     */
    abstract file(field: string): any;

    /**
     * Returns the value of the specified header field in this request (req). Note that header
     * names are case-insensitive.
     *
     * @param header - Name of the header to retrieve the value for (case-insensitive).
     */
    abstract get(header: string): string;

    /**
     * Returns true if this request's declared "Content-Type" matches the specified media/mime type.
     *
     * Specifically, this method matches the given type against this request's "Content-Type" header.
     *
     * @param type - Mime type to check against the request's Content-Type header.
     */
    abstract is(type: string): boolean;

    /**
     * Returns the value of the parameter with the specified name, or if the parameter has not
     * been specified, returns defaultValue instead.
     *
     * @param name - Name of the parameter to retrieve the value for.
     * @param defaultValue - Default value to return in the event that the named parameter was
     * not found.
     * @returns the value of the named parameter, or defaultValue if the parameter was not
     * specified along with the request.
     */
    abstract param(name: string, defaultValue?: any): any;

    /**
     * Override the inferred locale for this request.
     *
     * Normally, the locale is determined on a per-request basis based on incoming request headers
     * (i.e. a user's browser or device language settings). This command overrides that setting for
     * a particular request.
     *
     * @param override - The locale code to override the detected value with.
     */
    abstract setLocale(override: string): void;

    /**
     * Time out this request if a response is not sent within the specified number of milliseconds.
     *
     * Note: by default, normal HTTP requests to Node.js/Express/Sails.js apps time out after 2 minutes
     * (120000 milliseconds) if a response is not sent.
     */
    abstract setTimeout(numMilliseconds: number): void;

}

export abstract class SailsResponse {

    /**
     * Indicate to a web browser or other user agent that an outgoing file download sent in
     * this response should be "Saved as..." rather than "Opened", and optionally specify the
     * name for the newly downloaded file on disk.
     *
     * Specifically, this sets the "Content-Disposition" header of the current response to
     * "attachment". If a filename is given, then the "Content-Type" will be automatically
     * set based on the extension of the file (e.g. .jpg or .html), and the "Content-Disposition"
     * header will be set to "filename=filename".
     *
     * @param filename - Optional name to use as the default when saving the file.
     */
    abstract attachment(filename?: string): void;

    /**
     * This method is used to send a 400 ("Bad Request") response back down to the client indicating
     * that the request is invalid. This usually means it contained invalid parameters or headers, or
     * tried to do something impossible based on your app logic.
     *
     * @param data - Optional data to send out with the response.
     */
    abstract badRequest(data?: any): void;

    /**
     * Clears cookie (name) in the response.
     *
     * @param name - Name of the cookie which should be cleared by the response.
     * @param options - Options regarding the cookie.
     */
    abstract clearCookie(name: string, options?: CookieOptions): void;

    /**
     * Sets a cookie with the given name and value to be sent along with the response.
     *
     * @param name - Name to associate with the given value.
     * @param value - Value to set the named cookie to.
     * @param options - Options regarding the cookie.
     */
    abstract cookie(name: string, value: any, options?: CookieOptions): void;

    /**
     * This method is used to send a 403 ("Forbidden") response back down to the client indicating
     * that the request is not allowed. This usually means the user-agent tried to do something it
     * was not allowed to do, like change the password of another user.
     *
     * @param data - Optional data to send out with the response.
     */
    abstract forbidden(data?: any): void;

    /**
     * Returns the current value of the specified response header.
     *
     * @param headerName - Name of the header to retreive the value for.
     */
    abstract get(headerName: string): string;

    /**
     * Sends a JSON response composed of a stringified version of the specified data.
     *
     * @param statusCode - Optional status code to send alongside the response.
     * @param data - Data to be JSONified out into the response.
     */
    abstract json(statusCode?: number, data?: any): void;

    /**
     * Send a JSON or JSONP response.
     *
     * Identical to res.json() except that, if a request parameter named "callback" was
     * provided in the query string, then Sails will send the response data as JSONP instead
     * of JSON. The value of the "callback" request parameter will be used as the name of the
     * JSONP function call wrapper in the response.
     *
     * @param data - Data to be JSONified out into the response.
     */
    abstract jsonp(data?: any): void;

    /**
     * Sets the "Location" response header to the specified URL expression.
     *
     * @param url - Value which the Location header should be set to in this response.
     */
    abstract location(url: string): void;

    /**
     * This method is used to send a 404 ("Not Found") response using either res.json() or
     * res.view(). Called automatically when Sails receives a request which doesn't match
     * any of its explicit routes or route blueprints (i.e. serves the 404 page).
     *
     * When called manually from your app code, this method is normally used to indicate that
     * the user-agent tried to find, update, or delete something that doesn't exist.
     *
     * @param data - Optional data to send out with the response.
     */
    abstract notFound(data?: any): void;

    /**
     * This method is used to send a 200 ("OK") response back down to the client.
     *
     * @param data - Optional data to send out with the response.
     */
    abstract ok(data?: any): void;

    /**
     * Redirect the requesting user-agent to the given absolute or relative url.
     *
     * @param statusCode - Optional status code to send along with the redirect.
     * @param url - URL which the requester should be directed to.
     */
    abstract redirect(statusCode?: number, url?: string);

    /**
     * Send a simple response. statusCode defaults to 200 ("OK").
     *
     * This method is used in the underlying implementation of most of the other terminal
     * response methods.
     *
     * @param statusCode - Optional status code to send along with the response.
     * @param body - Body data to output for the response.
     */
    abstract send(statusCode?: number, body?: any): void;

    /**
     * This method is used to send a 500 ("Server Error") response back down to the client
     * indicating that some kind of server error occurred (i.e. the error is not the requesting
     * user agent's fault).
     *
     * @param err - Optional error message to output.
     */
    abstract serverError(err?: any): void;

    /**
     * Sets specified response header (header) to the specified value (value).
     *
     * Alternatively, you can pass in a single object argument (headers) to set multiple header
     * fields at once, where the keys are the header field names, and the corresponding values
     * are the desired values.
     *
     * @param header - Name of the header which should have its value set.
     * @param value - New value to assign to the named header.
     */
    abstract set(header: string, value: string): void;

    /**
     * Set the status code of this response.
     *
     * This method may be called any number of times prior to sending out the actual response.
     *
     * @param statusCode - The status code to use for this response.
     */
    abstract status(statusCode: number): void;

    /**
     * Sets the "Content-Type" response header to the specified type.
     *
     * This method is pretty forgiving (see https://sailsjs.com/documentation/reference/response-res/res-type),
     * but note that if type contains a "/", res.type() assumes it is a MIME type and interprets it literally.
     *
     * @param type - Type name to use for the Content-Type header.
     */
    abstract type(type: string): void;

    /**
     * Respond with an HTML page.
     *
     * @param pathToView - The path to the desired view file relative to your app's views
     * folder (usually views/), without the file extension (e.g. .ejs), and with no trailing
     * slash. Defaults to "identityOfController/nameOfAction".
     * @param locals - Data to pass to the view template. These explicitly specified locals
     * will be merged in to Sails' built-in locals and your configured app-wide locals.
     * Defaults to {}.
     */
    abstract view(pathToView?: string, locals?: Object): void;

    /**
     * Given an error (err), attempt to guess which error response should be called (badRequest,
     * forbidden, notFound, or serverError) by inspecting the status property. If err is not a
     * dictionary, or the status property does not match a known HTTP status code, then default
     * to serverError.
     *
     * Especially handy for handling potential validation errors from Model.create() or Model.update().
     *
     * @param err - Error containing a status field by which the HTTP response might be deduced.
     *
     * @deprecated it is suggested to use a custom response instead.
     */
    abstract negotiate(err: Error): void;

}
