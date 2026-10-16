---
title: Quick start
description: Build a voice agent, test it in your browser and connect it to your website or a phone number in about fifteen minutes.
sidebar:
  order: 2
---

Build a voice agent, test it in your browser and connect it to a phone number. About fifteen minutes.

## 1. Create an agent

Sign in at [app.lightmove.ai](https://app.lightmove.ai) and choose **New agent**. Describe what it should do in a sentence or two. The Agent Builder drafts a workflow you can edit.

:::tip
Be specific about the edges: what the agent must not promise, and when it should hand over to a person.
:::

## 2. Test it in the browser

Press **Test call** in the builder and speak to the agent. Each test is saved with a transcript so you can see where it went off track.

## 3. Put it on your website

Copy the embed snippet from **Deploy → Web widget** and paste it before the closing `</body>` tag:

```html
<script
  src="https://app.lightmove.ai/embed/lightmove-widget.js?token=YOUR_TOKEN&apiEndpoint=app.lightmove.ai"
  async
></script>
```

See [Web widget](/docs/go-live/web-widget) for the embed modes and the JavaScript API.

## 4. Connect a phone number

Under **Deploy → Telephony**, connect a number from your provider or point your SIP trunk at LightMove. Calls to that number now reach your agent. See [Phone numbers and SIP](/docs/go-live/telephony).

:::caution[Before going live]
Run at least three test calls end to end, including one transfer to a person.
:::
