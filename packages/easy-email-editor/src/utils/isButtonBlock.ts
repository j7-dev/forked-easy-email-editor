import { BasicType, AdvancedType } from 'j7-easy-email-core';

export function isButtonBlock(blockType: any) {
  return blockType === BasicType.BUTTON || blockType === AdvancedType.BUTTON;
}