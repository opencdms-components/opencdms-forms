/**
 * components.js is used as the entry-point in webpack.config.js
 *
 */
import Vue from 'vue';
import wrap from '@vue/web-component-wrapper'
import vuetify from './plugins/vuetify';
import HelloWorld from './components/HelloWorld.vue';

const CustomElement = wrap(Vue, HelloWorld)

window.customElements.define('my-element', CustomElement)