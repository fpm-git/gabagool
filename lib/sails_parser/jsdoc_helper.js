
/* eslint-disable no-useless-escape */
// ^ eslint doesn't understand the regex...

function extractTypes(typesDecl) {
    if (typeof typesDecl !== 'string') {
        return [];
    }
    typesDecl = typesDecl.replace(/[{}]/g, '');
    // if the type is a promise, there's no need to split the '|'
    // TODO/NOTE: this needs tweaking to work better with Promise<any>|SomeOtherType
    if (typesDecl.startsWith('Promise<')) {
        return [typesDecl];
    }
    return typesDecl.split('|');
}

function extractParamAnnotations(annotations) {
    // leave if we've no proper array given
    if (!Array.isArray(annotations)) {
        return [];
    }

    // setup results listing
    const out = [];
    annotations.forEach((annotation) => {
        if ((annotation.type !== '@param') || (typeof annotation.value !== 'string')) {
            return;
        }
        // ({[A-Za-z_$<>\[\]\|]+})?[\s+]?(\[?[A-Za-z_$][A-Za-z_$0-9]+\]?)[\s+]?-?[\s+]?(.+)?
        const fragments = annotation.value.match(/({[A-Za-z_$<>\[\]\|.]+})?[\s+]?(\[?[A-Za-z_$][A-Za-z_$0-9]{0,}\]?)[\s+]?-?[\s+]?(.+)?/); // ...
        const param = {
            types: extractTypes(fragments[1]),
            name: fragments[2],
            description: fragments[3],
            optional: false,
        };
        if (param.name) {
            if (param.name.startsWith('[')) {
                param.name = param.name.replace(/[\]\[]/g, '');
                param.optional = true;
            }
            out.push(param);
        }
    });

    return out;
}

function extractReturnAnnotation(annotations) {
    // leave if we've no proper array given
    if (!Array.isArray(annotations)) {
        return undefined;
    }

    for (let i = 0; i < annotations.length; i++) {
        const n = annotations[i];
        if ((n.type !== '@returns') || (typeof n.value !== 'string')) {
            continue;
        }
        const fragments = n.value.match(/({[A-Za-z_$<>\[\]\|]+})?[\s+]?-?[\s+]?(.+)?/);
        return {
            types: extractTypes(fragments[1]),
            description: fragments[2]
        };
    }
}

/**
 * Parses some JSDoc into a more digestable format.
 */
function parseJSDoc(commentBlock) {
    // leave if we've not been given a proper string block
    if (typeof commentBlock !== 'string') {
        return undefined;
    }

    // leave if it's actually not a JSDoc comment
    if (!commentBlock.startsWith('*')) {
        return undefined;
    }

    // trim out all * (and some whitespace)
    commentBlock = commentBlock.substr(1).replace(/(\r|\n)(( |\t)+)?\*/g, '').trim();

    // partition all annotations
    const blockSplit = commentBlock.split(/(@[A-Za-z]+)/g);

    // we've not even a description, so buh-bye
    if (blockSplit.length < 0) {
        return undefined;
    }

    // get description and prepare proper annotations list
    const description = blockSplit[0];
    const annotations = [];

    blockSplit.shift();
    while (blockSplit.length > 0) {
        const type = blockSplit.shift();
        if (!type.startsWith('@') || type.endsWith(' ')) {
            return;
        }
        const value = (blockSplit[0] && blockSplit[0].startsWith(' ')) ? blockSplit.shift().trim() : undefined;
        annotations.push({
            type,
            value,
        });
    }

    const parameters = extractParamAnnotations(annotations);
    const returns = extractReturnAnnotation(annotations);

    return {
        description,
        annotations,
        parameters,
        returns,
    };
}

/**
 * Regenerates JSDoc text, given an object of the same form as yielded by parseJSDoc.
 * @param {Object} docDesc - An object describing some JSDoc comment, as returned by parseJSDoc.
 */
function constructJSDoc(docDesc) {
    if (!docDesc) {
        return '';
    }

    let out = '';
    if ((typeof docDesc.description === 'string') && (docDesc.description.trim().length > 0)) {
        out = `\n   * ${docDesc.description.trim()}`;
    }

    (docDesc.parameters || []).forEach(param => {
        if (out.length > 0) {
            out += '\n   *';
        }
        out += '\n   * @param';
        if (Array.isArray(param.types)) {
            out += ` {${param.types.join('|')}}`;
        }
        if (param.name) {
            out += ` ${param.name}`;
        }
        if (param.description) {
            out += ` - ${param.description.trim()}`;
        }
    });
    (docDesc.annotations || []).forEach(annotation => {
        if ((annotation.type === '@param') || (annotation.type === '@returns')) {
            return;
        }
        if (out.length > 0) {
            out += '\n   *';
        }
        out += `\n   * ${annotation.type}`;
        if ((typeof annotation.value === 'string') && (annotation.value.length > 0)) {
            out += ` ${annotation.value}`;
        }
    });

    if (docDesc.returns) {
        if (out.length > 0) {
            out += '\n   *';
        }
        out += '\n   * @returns';
        if (Array.isArray(docDesc.returns.types)) {
            out += ` {${docDesc.returns.types.join('|')}}`;
        }
        if (docDesc.returns.description) {
            out += ` ${docDesc.returns.description.trim()}`;
        }
    }

    return '/**' + out + '\n   */';
}


module.exports = {

    parseJSDoc,

    constructJSDoc,

};
