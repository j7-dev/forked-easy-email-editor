import React, { useMemo } from 'react';
import { useFocusIdx } from 'j7-easy-email-editor';
import { TextField } from '../../../components/Form';

export function BorderWidth() {
  const { focusIdx } = useFocusIdx();

  return useMemo(() => {
    return (
      <TextField
        label={t('Width')}
        quickchange
        name={`${focusIdx}.attributes.border-width`}
      />
    );
  }, [focusIdx]);
}
