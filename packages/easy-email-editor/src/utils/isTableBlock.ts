import { BasicType, AdvancedType } from 'j7-easy-email-core';

export function isTableBlock(blockType: any) {
  return blockType === AdvancedType.TABLE;
}
