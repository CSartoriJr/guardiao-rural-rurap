'use server';
/**
 * @fileOverview Flow para receber e armazenar feedback dos usuários.
 *
 * - submitFeedback - Função exportada para ser chamada pelo lado do cliente.
 * - SubmitFeedbackInput - Tipo de entrada da função.
 * - SubmitFeedbackOutput - Tipo de saída da função.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { db, firebaseInitializedCorrectly } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

const FEEDBACKS_COLLECTION = 'feedbacks';

const SubmitFeedbackInputSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: 'Por favor, insira um e-mail válido.' }),
  comment: z.string().min(5, { message: 'O comentário deve ter pelo menos 5 caracteres.' }),
});
export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackInputSchema>;

const SubmitFeedbackOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SubmitFeedbackOutput = z.infer<typeof SubmitFeedbackOutputSchema>;


export async function submitFeedback(input: SubmitFeedbackInput): Promise<SubmitFeedbackOutput> {
  return submitFeedbackFlow(input);
}

const submitFeedbackFlow = ai.defineFlow(
  {
    name: 'submitFeedbackFlow',
    inputSchema: SubmitFeedbackInputSchema,
    outputSchema: SubmitFeedbackOutputSchema,
  },
  async ({ name, email, comment }) => {
    if (!firebaseInitializedCorrectly || !db) {
      const msg = "[submitFeedbackFlow] Firestore não está inicializado.";
      console.error(msg);
      return { success: false, message: "O servidor de dados não está disponível no momento." };
    }

    try {
      // 1. Verificar se o e-mail já existe
      const feedbacksRef = collection(db, FEEDBACKS_COLLECTION);
      const q = query(feedbacksRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        console.log(`[submitFeedbackFlow] Tentativa de feedback duplicado para o e-mail: ${email}`);
        return { success: false, message: 'E-mail já utilizado. Agradecemos seu interesse, mas só é permitido um comentário por e-mail.' };
      }

      // 2. Adicionar o novo feedback
      const docData = {
        name: name || 'Anônimo',
        email: email, // Armazenado para verificação, mas não será exibido publicamente
        comment: comment,
        createdAt: serverTimestamp(),
      };

      await addDoc(feedbacksRef, docData);
      console.log(`[submitFeedbackFlow] Novo feedback adicionado para: ${email}`);

      return { success: true, message: 'Seu comentário foi enviado com sucesso. Obrigado!' };

    } catch (error: any) {
      console.error('[submitFeedbackFlow] Erro ao salvar feedback:', error);
      return { success: false, message: 'Ocorreu um erro no servidor ao tentar salvar seu comentário.' };
    }
  }
);
