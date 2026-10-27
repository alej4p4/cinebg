/**
 * TvCursorOverlay.tsx
 * 
 * DESATIVADO PERMANENTEMENTE:
 * A experiência em Smart TVs e TV Boxes no CineBG é 100% nativa via controle
 * remoto D-Pad (Norigin Spatial Navigation), com foco direto de card em card.
 * Ponteiros de mouse virtuais foram erradicados da interface para garantir
 * usabilidade rápida, limpa e padronizada no controle remoto.
 */
import React from 'react'

export const startMoveLoop = () => {
  // Mantido para compatibilidade de contrato: o cursor virtual está permanentemente inativo
}

export const TvCursorOverlay: React.FC = () => {
  // Retorna null: nenhum ponteiro de mouse é renderizado na TV
  return null
}

export default TvCursorOverlay
