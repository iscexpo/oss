import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart, DataPartName, DataPartPayload } from '../messages/data-parts'

type Writer = UIMessageStreamWriter<UIMessage<never, DataPart>>

/**
 * Emits a custom data part into the UI message stream with an auto-derived
 * `data-<name>` type, removing the per-tool writer boilerplate.
 *
 * Type safety comes from the `(name, data)` pair: `data` is checked against
 * the payload schema registered for `name` in `data-parts.ts`.
 */
export function emitData<Name extends DataPartName>(
  writer: Writer,
  toolCallId: string,
  name: Name,
  data: DataPartPayload<Name>
) {
  writer.write({
    id: toolCallId,
    type: `data-${name}` as never,
    data,
  })
}