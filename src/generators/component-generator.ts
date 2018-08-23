import fs from 'fs-extra-promise';
import beautify from 'js-beautify';
import path from 'path';
import { Config } from './../../config/config';
import { Component } from './../analysers/models/component';
import { Variable } from './../analysers/models/variable';
import { DataRemover } from './../utils/data-remover';
import { RootPath } from './../utils/root-path';


export class ComponentGenerator {
    generate(componentName: string, component: Component): Promise<any | string> {
        const remover = new DataRemover();
        const inputsCode = this.getInputsCode(component);
        const propertiesCode = this.getPropertiesCode(component);
        const injectionsCode = this.getInjectionsCode(component);
        const functionsCode = this.insertThisReference(
            this.getFunctionsCode(component),
            component.inputs,
            component.properties,
            component.injections
        );
        const doCheckCode = this.insertThisReference(
            this.getDoCheckCode(component),
            component.inputs,
            component.properties,
            component.injections
        );

        const samplePath = path.join(RootPath.path, './samples/component.sample.ts');

        return new Promise((resolve, reject) => {
            fs.readFileAsync(samplePath)
                .then(data => {
                    let content = data.toString();
                    content = content
                        .replace('$selector', component.selector)
                        .replace('$templateUrl', component.templateUrl || '')
                        .replace('$styleUrl', component.styleUrl || '')
                        .replace('$componentName', componentName)
                        .replace('$inputs', inputsCode)
                        .replace('$properties', propertiesCode)
                        .replace('$injections', Config.components.insertInjections ? injectionsCode : '')
                        .replace('$functions', functionsCode)
                        .replace('$todo', component.todo)
                        .replace('$doCheck', doCheckCode);
                    content = remover.removeEmptyLines(content);
                    content = beautify(content);

                    if (Config.components.downgrade) {
                        content = this.downgradeComponent(content, component)
                            .replace('$moduleName', Config.moduleName)
                            .replace('$ComponentClass', componentName)
                            .replace('$componentName', component.name);
                    } else {
                        // Remove downgrade code comments if downgrade is set to false
                        content = remover.removeJSComments(content);
                    }

                    resolve(content);
                })
                .catch(err => reject(err));
        });
    }

    private getInputsCode(component: Component): string {
        let code = '';
        if (component.inputs) {
            for (const input of component.inputs) {
                code += `@Input() public ${input.name}: ${input.type}${input.value ? ` = ${input.value}` : ''};\n`
            }
        }
        return code;
    }

    private getPropertiesCode(component: Component): string {
        let code = '';
        if (component.properties) {
            for (const property of component.properties) {
                let value = typeof property.value === 'string' ? property.value : JSON.stringify(property.value);
                code += `private ${property.name}: ${property.type}${property.value ? ` = ${value}` : ''};\n`
            }
        }
        return code;
    }

    private getInjectionsCode(component: Component): string {
        let code = '';
        if (component.injections) {
            const injections = component.injections || [];
            injections.forEach((item, index) => {
                code += `private ${item.name}: ${item.type}`;
                if (index < injections.length - 1) {
                    code += ',\n';
                }
            })
        }
        return code;
    }

    private getFunctionsCode(component: Component): string {
        let functionsCode = '';

        if (component.functions) {
            for (const fn of component.functions) {
                if (fn.name === '$doCheck') continue;
                let body = fn.body;
                const functionsToUpdate = body.match(/function\(.*?\)/g) || [];
                for (const match of functionsToUpdate) {
                    let params = match.substring(match.indexOf('('))
                    body = body.replace(match, `${params} =>`);
                }
                body = body.replace(/\.bind\(this\)/g, '');
                functionsCode += `${fn.comment || ''}\npublic ${fn.name}(${this.getParametersCode(fn.parameters)}){${body}}\n\n`;
            }
        }
        return functionsCode;
    }


    private getDoCheckCode(component: Component): string {
        let code = '';

        if (component.functions) {
            const fn = component.functions.find(_fn => _fn.name === '$doCheck');
            if (fn) {
                code = fn.body;
                const functionsToUpdate = code.match(/function\(.*?\)/g) || [];
                for (const match of functionsToUpdate) {
                    let params = match.substring(match.indexOf('('))
                    code = code.replace(match, `${params} =>`);
                }
                code = code.replace(/\.bind\(this\)/g, '');
            }
        }

        return code;
    }

    private getParametersCode(params?: Variable[]): string {
        let code = '';
        if (params) {
            params.forEach((param, index) => {
                code += `${param.name}: ${param.type}${param.value ? ` = ${param.value}` : ''}`
                code += index < params.length - 1 ? ',' : '';
            })
        }
        return code;
    }

    private insertThisReference(code: string, inputs: Variable[] = [], properties: Variable[] = [], injections: Variable[] = []): string {
        const toUpdate = inputs.concat(properties).concat(injections);

        // for (const value of toUpdate) {
        //     const name = value.name.replace(/\$/g, '\\$');
        //     const updatedContent = new RegExp(`[^var](\\s|,)${name}`, 'g');
        //     const matchesToUpdate = code.match(updatedContent);
        //     if (matchesToUpdate) {
        //         for (let match of matchesToUpdate) {
        //             code = code.replace(match, match.replace(name, `this.${value.name}`));
        //         }
        //     }
        // }
        code = code.replace(/ctrl/g, 'this');
        return code;
    }



    private downgradeComponent(componentCode: string, component: Component) {
        const downgradeExp = new RegExp('\/\/ DOWNGRADE([\n|\r].*?)*\/\/ END DOWNGRADE', 'g');
        const downgradeMatches = componentCode.match(downgradeExp) || [];
        for (const match of downgradeMatches) {
            let code = match
                .replace('// DOWNGRADE', '')
                .replace('// END DOWNGRADE', '')
                .replace(/\/\/\s/g, '');
            componentCode = componentCode.replace(match, code);
        }
        return componentCode;
    }
}
