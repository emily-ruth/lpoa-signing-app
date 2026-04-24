/**
 * Full Limited Revocable Power of Attorney instrument for in-app display (v2).
 * Source: Legal PDF “Limited Revocable Power of Attorney (last edited 3-10-2026)”.
 */
export const LPOA_DOCUMENT_VERSION_LABEL = 'Legal instrument — last edited March 10, 2026';

export type LpoaDocumentBlock =
  | { readonly kind: 'paragraph'; readonly text: string }
  | { readonly kind: 'labeled'; readonly label: string; readonly text: string };

export const LPOA_DOCUMENT_BLOCKS: readonly LpoaDocumentBlock[] = [
  {
    kind: 'paragraph',
    text: 'I, the undersigned principal (the "Principal"), do hereby grant to BlackCloak, Inc., a Delaware corporation, and its employees and representatives (the "Agent"), as my agent to have the full power and authority to exercise the following powers:',
  },
  {
    kind: 'paragraph',
    text: 'To exercise data rights on my behalf and to remove my personally identifiable information from third party websites and databases and to otherwise prevent third parties from sharing my personally identifiable information with others.',
  },
  {
    kind: 'paragraph',
    text: 'This grant of authority includes all incidental acts as are reasonably necessary to carry out such powers.',
  },
  {
    kind: 'labeled',
    label: 'Reliance.',
    text: 'Any third party may rely upon the existence of this instrument and may deal in good faith with the Agent as if the Agent\'s authority were in full force and effect, unless such third party has actual knowledge of its revocation, termination, or invalidity.',
  },
  {
    kind: 'labeled',
    label: 'Limitation.',
    text: 'This grant of authority is limited to the powers described above, and does not include any other powers not expressly granted herein. Principal does not grant the Agent any authority over the Principal\'s property, finances, medical or healthcare decisions, or business affairs.',
  },
  {
    kind: 'labeled',
    label: 'Revocation.',
    text: 'The Principal shall have the unlimited right, at any time and for any reason, with or without cause, to revoke this power of attorney and the powers granted herein. This power of attorney shall automatically be revoked upon termination of the agreement between Principal and Agent.',
  },
  {
    kind: 'labeled',
    label: 'Acceptance:',
    text: 'The Agent accepts this appointment as power of attorney subject to the terms of this power of attorney and the agreement between Principal and Agent.',
  },
] as const;
