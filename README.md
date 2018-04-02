# gabagool
Dr. Yukistein's battle against the ruthless enemy of no-more-Intellisense, with experimental magic and mad science!

## What is this...?
What exactly is gabagool? Simply put: it's a helper utility intended to overcome some framework/language limitations.

Because Sails uses globals for model and service definitions, we lose Intellisense/code-analysis features provided by IDEs, which don't really know how to correlate between global names and the files Sails maps to them. Even with the global feature disabled and using direct `require(...)` statements, there are issues to do with missing definitions and lack of instance types.

Gabagool fixes this by scanning your project and generating definition files where appropriate. Also provided are some definitions for Sails-specific globals and types (sails.*, etc..), to help your IDE help you as much as possible ^^.

Additionally, Gabagool will also scan for potential issues regarding hook imports, model/service definitions, and general syntax errors, with more features coming in the future!

As of now, Gabagool supports only Sails v1. Support for older versions is not planned.

Here's a little before-and-after showing just a few benefits/changes from using Gabagool, as opposed to a vanilla IDE:

<img width="1250" alt="before-after-gg" src="https://user-images.githubusercontent.com/16318014/38210772-f759ea4e-367d-11e8-9590-ac558486ec7b.png">

## How do I use this?
Using gabagool is really very simple.

First of all, make sure you've got the utility installed with: `npm install git+ssh://git@github.com:fpm-git/gabagool.git -g`

Once you have Gabagool installed, all you have to do in order to process your project and get all the benefits is:
- Activate the project directory with `cd`.
- Run `gabagool` in the terminal.
- Done. Boom. There should be some information output (potentially with some warnings or errors, if the project has any), and if all went well, a .types folder produced alongside a jsconfig.json.

To really get the most out of Gabagool, it is recommended that you read the "Documenting with Gabagool" section just below.

## Documenting with Gabagool
Gabagool extracts type definitions for model attributes based on their type property, or if they are associations, it will simply use the type of the referenced model.

For methods not provided by Waterline/Sails, type information must be extracted from JSDoc. Particularly relevant are the `@param {type} name` and `@returns {type} desc` annotations.

In order to receive Intellisense typing for function parameters, `@param {type} name` should be used to label the parameter. If no `@param` annotation is found for a parameter, then the type is set to be `any`.

In order to receive Intellisense typing for the response value of a function, the `@returns {type} desc` annotation must be used to describe the function's response. If no `@returns` annotation is found, then the return type is assumed to be `any`.

If your function accepts an instance of some Waterline model as a parameter, or happens to return a model instance, then the model's name should use the '$' prefix and a suffix of 'Instance'. For example, if the `usr` parameter is an instance of some `User` model, one should use a definition of `@param {$UserInstance} usr`.

By adding the parameter type annotation in JSDoc, not only will Gabagool export the function with the appropriately typed parameter, but you will also receive Intellisense support for properties of the corresponding type directly within your IDE.

For a complete example showing how param/return annotations should be handled:
```js
/**
 * Bans the given user, returning the created ban.
 *
 * @param {$UserInstance|string} user - Instance of the user to ban, or a user's ID.
 * @returns {$UserBanInstance} the newly created userban.
 * @throws If the user could not be found, throws an error.
 */
async banUser(user) {
  const userInst = (typeof user === 'object') ? user : await User.findOne(user);
  // throw if we couldn't find a user based on given ID
  if (typeof userInst !== 'object') {
    throw new Error(`User with ID ${user} could not be found!`);
  }
  // otherwise ban the user
  return await UserBan.create({ user: userInst.id, endDate: new Date() }).fetch();
}
```

When documenting controllers with `req` and `res` parameters, one should use the `SailsRequest` and `SailsResponse` types accordingly in order to receive suggestions with appropriate fields for each.

## Collaborating with Gabagool
There are no special steps that need to be taken in order to collaborate with Gabagool, though some recommendations exist.

Adding Gabagool instance types to the JSDoc won't harm the experience for other collaborators, but it will greatly improve things for those who are using Gabagool.

Before committing, any issues reported by Gabagool should be fixed, as these are general warnings to do with Sails/hooks/ etc. (they can affect anyone, regardless of Gabagool or not).

The `.types` folder and `jsconfig.json` file should be added to the project's `.gitignore`, so as to prevent recording the many changes to ambient type files over time. Contributors should opt-in to Gabagool's definitions on their own, by running the utility locally.

