import { fileURLToPath } from 'node:url';

import ts from 'typescript';

import { createClient } from '../bundle/client';

describe('exactOptionalPropertyTypes', () => {
  it('type-checks the fetch runtime and shared helpers with strict optional properties', () => {
    const program = ts.createProgram(
      [fileURLToPath(new URL('../bundle/client.ts', import.meta.url))],
      {
        exactOptionalPropertyTypes: true,
        lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        noEmit: true,
        noPropertyAccessFromIndexSignature: true,
        noUncheckedIndexedAccess: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        skipLibCheck: true,
        strict: true,
        target: ts.ScriptTarget.ES2022,
        types: [],
      },
    );

    expect(
      ts
        .getPreEmitDiagnostics(program)
        .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')),
    ).toEqual([]);
  });

  it.each([undefined, { hello: 'world' }])('preserves SSE request body %j', async (body) => {
    const fetch = vi.fn().mockResolvedValue(new Response('data: {"ok":true}\n\n'));
    const client = createClient({ baseUrl: 'https://example.com', fetch });
    const { stream } = await client.sse.post({
      body,
      sseMaxRetryAttempts: 1,
      url: '/events',
    });

    const events = [];
    for await (const event of stream) events.push(event);

    expect(events).toEqual([{ ok: true }]);
    expect(fetch).toHaveBeenCalledOnce();
    const request = fetch.mock.calls[0]![0] as Request;
    expect(request.method).toBe('POST');
    expect(await request.text()).toBe(body === undefined ? '' : JSON.stringify(body));
  });
});
