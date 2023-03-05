Given that Vue 2 will reach [End of Life (EOL)](https://v2.vuejs.org/lts/) on 31st December 2023, the OpenCDMS Project Technical Team has has decided to adopt Vue 3 and Vuetify 3. However, we have also taken the decision to use [vuetify-jsonschema-form (vjsf)](https://koumoul-dev.github.io/vuetify-jsonschema-form/latest/) which currently still requires Vue 2 and Vuetify 2 with a possible Vuetify 3 update [planned for the future](https://github.com/koumoul-dev/vuetify-jsonschema-form/issues/409)).

Reading through the Vue 3 documentation, and specifically [the advice on achieving Vue 2 compatibility](https://www.npmjs.com/package/@vue/compat#:~:text=Dependencies%20that%20rely%20on%20Vue%202%20internal%20APIs) with Vue 3 the Vue.JS core developers write:
> While we've tried hard to make the migration build mimic Vue 2 behavior as much as possible, there are some limitations that may prevent your app from being eligible for upgrading:
> -   Dependencies that rely on Vue 2 internal APIs or undocumented behavior. The most common case is usage of private properties on `VNodes`. If your project relies on component libraries like Vuetify, Quasar or ElementUI, it is best to wait for their Vue 3 compatible versions.

So we're unable to directly incorporate and upgrade Vuetify 2 components directly in the new application.

Given that we're currently in a prototype phase, one option is to just deploy our Vue 3 and Vue 2 capabilities separately and possibly even serve the two solutions at the same domain. This could give a fairly seemless experience, especially during the earliest phase where we don't necessarily have to demonstrate authentication.

However another option, that potentially fits well with the OpenCDMS design goals, is that we could bundle up our Vuetify 2 capability as a reusable [web component](https://en.wikipedia.org/wiki/Web_Components) that can be included in any HTML page or even included in an application created using another web framework.

OpenCDMS App encourages the development of web components as a way for third-party developers to add plug-in capabilities to the application without necessarily having to adopt all of our technology choices. This potentially lowers the barrier of entry, but there could be obstacles to overcome such as slower performance resulting from multiple frameworks being used within the application.

Creating vuetify 2 web component(s) for use in the new Vuetify 3 application would be the acid test of the web component approach because we would have to ensure we mitigate more potential conflicts (with multiple Vue and Vuetify versions existing in the same page) than other plugin developers.

## Initial investigations

I created a project with the depreciated [Vue CLI](https://cli.vuejs.org/) (`vue --version` = `@vue/cli 5.0.8`) and tried to use the `wc` [build target](https://cli.vuejs.org/guide/build-targets.html#web-component) with the `--inline-vue` option to create a web component from a Single File Component (\*.vue) file.

Note that Vue CLI doesn't give the option to use Yarn. I selected only Vue 2 and Babel, no eslint, TypeScript, PWA, router, vuex, CSS preprocessors, unit testing or end-to-end testing. I select the option to use `package.json`. Vue CLI automatically initialises the project as a git repo.

Following the [Vuetify 2 documentation](https://v2.vuetifyjs.com/en/getting-started/installation/#vue-cli-install), I then add Vuetify to the project with the "Vuetify 2 - Vue CLI (recommended)" option.

```bash
vue create vue2wc  # with just babel and vue 2
cd vue2wc
vue add vuetify
```

Adding Vuetify updated the following files:
```
modified:   package-lock.json
modified:   package.json
modified:   public/index.html
modified:   src/App.vue
modified:   src/components/HelloWorld.vue
modified:   src/main.js
modified:   vue.config.js

new file:   src/plugins/vuetify.js
new file:   src/assets/logo.svg
```

I then check that the application was running as expected.
```bash
npm run serve
```

Next I attempted to create a web component using the HelloWorld component from this default install:
```bash
npx vue-cli-service build --target wc --inline-vue --name hello-world src/components/HelloWorld.vue
```

> **Note:** When using `--inline-vue` the resulting `dist/demo.html` still imports vue, but this isn't used since the Vue import is now included within the bundled JS.

We can see the new web component by opening `dist/demo.html` in the browser. Disappointly it doesn't include any Vuetify components and has no styling. The resulting `dist` contains the logo in the `img` directory, but the logo isn't displayed because the vuetify CSS classes are having no effect.

We can try hacking a solution, firstly by finding the version of `vuetify-min-css` that we need on a CDN like [CloudFlare](https://cdnjs.com/libraries/vuetify/2.6.0) and importing this in our `HelloWorld.vue` component:

```CSS
<style>
  @import 'https://cdnjs.cloudflare.com/ajax/libs/vuetify/2.6.0/vuetify.min.css';
</style>
```

This causes the logo image to display... but Vuetify components are still missing.

However, for users of the overall Vue 2 app that the component exists within, we've now including Vuetify CSS for a second time. The CSS will be retrieved directly from the CDN and, because it is include is in the `<style>` tag, it will currently not be bundled up by webpack. Using the original Vuetify 2 CSS from a CDN is potentially a problem if we're including the resulting web component in a Vuetify 3 application that defines CSS classes with the same names but with different behaviour.

The more robust solution would be to instruct webpack to append a unique identifier to each class name to avoid potential conflicts between Vuetify 2 and Vuetify 3.

Another [problem](https://cli.vuejs.org/guide/build-targets.html#web-component:~:text=Vue%20CLI%20will%20automatically%20wrap%20and%20register) is that:
> Vue CLI will automatically wrap and register the component as a Web Component for you, and there's no need to do this yourself in `main.js`. You can use `main.js` as a demo app solely for development.

It does this using `@vue/web-component-wrapper` and [the docs](https://github.com/vuejs/vue-web-component-wrapper#usage) show the non-customizable JS that is presumably being used to wrap the component. Unfortunately we're not able to customize this JavaScript wrapper. As a result we're forced to try to include all the dependencies that are needed within the SFC. This would especially be a problem if there was a requirement for components to work within the Vue 2 app that they were created in and also to be separately bundled as reuable web components.

Trying to `Vue.use(Vuetify)` and add the required CSS within the SFC didn't work for me. I got the following browser error and no Vuetify content was rendered: `Layout was forced before the page was fully loaded. If stylesheets are not yet loaded this may cause a flash of unstyled content.`  At this point, it didn't feel useful to continue to hack together a solution that would work with the standard Vue CLI tools.

So, if we want to include Vuetify 2 web components in a Vuetify 3 application then the best solution is probably to bypass Vue CLI's `vue-cli-service` and use `@vue/web-component-wrapper` and webpack directly (noting that we would need to set CSS 'modules' to true to instruct webpack to rename our CSS classes).

## Webpack

We have concluded that the only way to include a Vuetify 2 (Vue 2) component within a Vuetify 3 (Vue 3) application is to fully bundle up all of the Vuetify 2 component's dependencies as a web component with all required JavaScript and CSS included inline with classes renamed to avoid conflicts.

[Get started](https://webpack.js.org/guides/getting-started/) with Webpack 5 by installing webpack and [webpack-cli](https://webpack.js.org/guides/getting-started/#basic-setup):
```bash
npm install webpack webpack-cli --save-dev
```

The above command added `"webpack": "^5.75.0"` and `"webpack-cli": "^5.0.1"` to the `"devDependencies"` section of `package.json`. In my case, `"vuetify-loader": "^1.7.0"` and `"vue-template-compiler": "^2.6.14"` already exist, so I don't need to install them.

By default, webpack is expecting the entry point to be `/src/index.js` , but this may be confusing if the overall project runs using `main.js`.  Since we've providing this custom entry point for creating web components from the project, let's call the entry point `/src/components.js`.

To bundle JavaScript libraries (dependencies) with `components.js`, we need to install the library locally, e.g.: `npm install --save lodash`. In `components.js` we now use `import _ from 'lowdash'`

**webpack.config.js**
```javascript
const path = require('path');
const { VuetifyLoaderPlugin } = require('vuetify-loader');

module.exports = {
  entry: './src/components.js',
  output: {
    filename: 'myComponents.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vuetify-loader'
      },
      {
        test: /\.sass$/,
        use: [
            'vue-style-loader',
            'css-loader',
            {
                loader: 'sass-loader',
                options: {
                    implementation: require('sass')
                }
            }
        ]
      }
    ]
  },
  plugins: [ new VuetifyLoaderPlugin() ]
};
```

**Notes:**
- For webpack to work we just include the `.vue` extension when importing Vue Single File Components
- If  I use `loader: vuetify-loader` for Vue SFCs I get an odd error where no JS can be parsed (so sticking with `vue-loader`)
- IF you get a `TypeError: Cannot read properties of undefined (reading 'styles')` in a `.vue` file then you'll need to add an empty `<style></style>` section


```
npm list vue-loader
`-- @vue/cli-service@5.0.8
  `-- vue-loader@17.0.1
```

Vue CLI services is installing `vue-loader@17.0.1`, but according to [this SO answer](https://stackoverflow.com/a/74718715/1624894)  `vue-loader` 16+ isn't compatible with vue 2.x

```bash
	npm install --save-dev @vue/cli-service@4.5.19
```
Then I got an error.... the structure of `vue.config.js` is different in older versions.
```bash
Error loading vue.config.js:
TypeError: defineConfig is not a function
```

Also, we now have vulnerabilities reported by npm install - that will continue to be a problem going forward without using the most recent versions.

## So, starting again...

```bash

nvm use 16  # or `nvm install 16`
npm install -g @vue/cli@4.5.19
vue --version
# @vue/cli 4.5.19

vue create my-app
# I think Vue CLI v5 didn't give the option to use yarn
# Vue CLI v4.5.19 gave the option to use Yarn or NPM (I chose npm)

cd my-app
vue use vuetify
#  Choose a preset: Vuetify 2 - Vue CLI (recommended)

npm install

```

This gave us
```js
  "devDependencies": {
    "@vue/cli-plugin-babel": "~4.5.19",
    "@vue/cli-service": "~4.5.19",
```

But other dependencies may not be correct, the following are all the same as before:
```bash
    "sass": "~1.32.0",
    "sass-loader": "^10.0.0",
    "vue-cli-plugin-vuetify": "~2.5.8",
    "vue-template-compiler": "^2.6.14",
    "vuetify-loader": "^1.7.0",
```

Previously `npm list vue-loader` gave (in Powershell):
```
`-- @vue/cli-service@5.0.8
  `-- vue-loader@17.0.1
```

Now the output is (in Bash):
```bash
└─┬ @vue/cli-service@4.5.19
  └── vue-loader@15.10.1
```

Let's add our `webpack.config.js` and `components.js`

**webpack.config.js**
```js
const path = require('path');
const { VuetifyLoaderPlugin } = require('vuetify-loader');

module.exports = {
  entry: './src/components.js',
  output: {
    filename: 'myComponents.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vuetify-loader'
      },
      {
        test: /\.sass$/,
        use: [
            'vue-style-loader',
            'css-loader',
            {
                loader: 'sass-loader',
                options: {
                    implementation: require('sass')
                }
            }
        ]
      }
    ]
  },
  plugins: [ new VuetifyLoaderPlugin() ]
};
```

**components.js**
```js
/**
 * components.js is used as the entry-point in webpack.config.js
 *
 */
import Vue from 'vue';
import vuetify from './plugins/vuetify';
import HelloWorld from './components/HelloWorld.vue';
```

 ```bash
npm install webpack webpack-cli --save-dev
npx webpack --config webpack.config.js --mode development
```

```bash
[webpack-cli] Error: [VuetifyLoaderPlugin Error] No matching rule for vue-loader found.
Make sure there is at least one root-level rule that uses vue-loader and VuetifyLoaderPlugin is applied after VueLoaderPlugin.
```

Revisiting the [vuetify-loader](https://github.com/vuetifyjs/vuetify-loader) docs, it looks like we need to setup [vue-loader](https://vue-loader.vuejs.org/guide/#manual-setup) more fully.
We don't want to follow the docs and do: `npm install -D vue-loader vue-template-compiler` because that will update our `devDependencies` to `"vue-loader": "^17.0.1"` and (according to [this SO answer](https://stackoverflow.com/a/74718715/1624894))  `vue-loader` 16+ isn't compatible with vue 2.x

Also recall that  `npm list vue-loader` tells us we have `vue-loader@15.10.1` installed by one of or dependencies.

So let's change `'vuetify-loader'` to `'vue-loader'`:
```bash
   rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      ...
   ]
```

Also add `const { VueLoaderPlugin } = require('vue-loader')` at the top and add ````
new VueLoaderPlugin()` to the `plugins` list. Before their Vuetify equivalents.

```bash
npx webpack --config webpack.config.js --mode development
```

Okay... so I now have a bundle that used `src/components.js` as the entry-point and therefore should contain `Vue`, `vuetify` and `HelloWorld` from `./components/HelloWorld.vue'.


**TODO:** See the webpack config example [here](https://vue-loader.vuejs.org/guide/#manual-setup) for processing `css` files and also the `<style>` section of SFC.


## Wrapping the Vue component as a web component

Next we're on to: https://github.com/vuejs/vue-web-component-wrapper/

```bash
npm install @vue/web-component-wrapper --save-dev
```

```js
import Vue from 'vue'
import wrap from '@vue/web-component-wrapper'

const Component = {
  // any component options
}

const CustomElement = wrap(Vue, Component)

window.customElements.define('my-element', CustomElement)
```

Note, we've renamed `webpack.config.js` as `components.config.js` to make sure that the main application's `npm run serve` doesn't attempt to use it. Also, we using `--mode production` because in `development` mode some of the mapping files that are useful for debugging are currently missing.

```bash
npx webpack --config components.config.js --mode production
```

Using Python to serve the build in the `dist` folder is currently giving an empty page (with a 0x0 hello-world web component)

```bash
python3 -m http.server 8080 --directory dist
```

Trying to serve the main application using `npm run serve` is currently giving an error: `Error: Rule can only have one resource source (provided resource and test + include + exclude)`.
