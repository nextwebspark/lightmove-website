---
title: Web widget
description: Add a talk button to any website with one script tag, choose floating, inline or headless mode, and control calls from JavaScript.
sidebar:
  order: 2
---

The web widget lets visitors talk to your agent from your website. Web calls appear in the same call log as phone calls.

## Add the script

Create an embed token under **Deploy → Web widget**, add your site to the allowed origins, then paste the snippet before `</body>`:

```html
<script
  src="https://app.lightmove.ai/embed/lightmove-widget.js?token=YOUR_TOKEN&apiEndpoint=app.lightmove.ai"
  async
></script>
```

## Embed modes

Choose the mode in the token settings:

| Mode         | What visitors see                                                             |
| ------------ | ----------------------------------------------------------------------------- |
| **Floating** | A talk button in the corner of every page.                                    |
| **Inline**   | The widget renders inside an element with `id="lightmove-inline-container"`. |
| **Headless** | No UI. Your page drives the call with the JavaScript API below.               |

## JavaScript API

The script exposes `window.LightMoveWidget`:

```js
const widget = window.LightMoveWidget;

widget.onStatusChange((status) => {
  // idle | connecting | connected | failed
  console.log('call status', status);
});

document.querySelector('#talk').addEventListener('click', () => widget.start());
document.querySelector('#hang-up').addEventListener('click', () => widget.stop());
```

Other callbacks: `onCallStart`, `onCallConnected`, `onCallDisconnected`, `onCallEnd` and `onError`.

## Pass context about the visitor

Add `data-lightmove-context` to the script tag, or call `setContext()` before starting a call. Values are available to your agent's prompts as `{{initial_context.<name>}}`.

```html
<script
  src="https://app.lightmove.ai/embed/lightmove-widget.js?token=YOUR_TOKEN&apiEndpoint=app.lightmove.ai"
  data-lightmove-context='{"plan":"pro","page":"pricing"}'
  async
></script>
```

```js
window.LightMoveWidget.setContext({ customer_name: 'Aoife' });
```
