import {
    createSaluteRequest,
    createSaluteResponse,
    createScenarioWalker,
    createSystemScenario,
    NLPRequest,
    NLPResponse,
} from '@salutejs/scenario'
import { SaluteMemoryStorage } from '@salutejs/storage-adapter-memory'
import { SmartAppBrainRecognizer } from '@salutejs/recognizer-smartapp-brain'
import { intents, userScenario } from './userScenario';


const systemScenario = createSystemScenario({
    RUN_APP: ({ req, res }, dispatch) => {
        if (req.request.payload.character.appeal === 'official') {
            res.setPronounceText('Я могу порекомендовать вам фильм на основе ваших предпочтений. Назовите фильм, который вам нравится, а я посоветую похожие')
            res.appendBubble('Я могу порекомендовать вам фильм на основе ваших предпочтений. Назовите фильм, который вам нравится, а я посоветую похожие')
        } else {
            res.setPronounceText('Я могу порекомендовать тебе фильм на основе твоих предпочтений. Назови фильм, который тебе нравится, а я посоветую похожие')
            res.appendBubble('Я могу порекомендовать тебе фильм на основе твоих предпочтений. Назови фильм, который тебе нравится, а я посоветую похожие')
        }
        // res.appendSuggestions(['Что ты умеешь?'])
        dispatch && dispatch(['searchMovie'])
    },
    NO_MATCH: ({ req, res, session }, dispatch) => {
        if (req.request.payload.character.appeal === 'official') {
            if (session.recommendations) {
                res.appendSuggestions(['Назвать другой фильм', 'Ещё'])
                res.setPronounceText('Скажите \"Ещё\" для следующей рекомендации или скажите \"Другой фильм\" чтобы узнать рекомендации на основе другого фильма')
                res.appendBubble('Скажите \"Ещё\" для следующей рекомендации или скажите \"Другой фильм\" чтобы узнать рекомендации на основе другого фильма')
            } else {
                res.setPronounceText('Назовите фильм чтобы узнать рекомендации на основе ваших предпочтений')
                res.appendBubble('Назовите фильм чтобы узнать рекомендации на основе ваших предпочтений')
                dispatch && dispatch(['searchMovie'])
            }
        } else {
            if (session.recommendations) {
                res.message.payload.device
                res.appendSuggestions(['Назвать другой фильм', 'Ещё'])
                res.setPronounceText('Скажи \"Ещё\" для следующей рекомендации или скажи \"Другой фильм\" чтобы узнать рекомендации на основе другого фильма')
                res.appendBubble('Скажи \"Ещё\" для следующей рекомендации или скажи \"Другой фильм\" чтобы узнать рекомендации на основе другого фильма')
            } else {
                res.setPronounceText('Назови фильм чтобы узнать рекомендации на основе твоих предпочтений')
                res.appendBubble('Назови фильм чтобы узнать рекомендации на основе твоих предпочтений')
                dispatch && dispatch(['searchMovie'])
            }
        }
    }
})

const scenarioWalker = createScenarioWalker({
    recognizer: new SmartAppBrainRecognizer('c4ac45a8-bc54-4779-bf57-4eb69a387b5b'),
    intents,
    userScenario,
    systemScenario
})

const storage = new SaluteMemoryStorage()

export const handleNlpRequest = async (request: NLPRequest): Promise<NLPResponse> => {
    const req = createSaluteRequest(request)
    const res = createSaluteResponse(request)
    const sessionId = request.uuid.userId
    const session = await storage.resolve(sessionId)
    await scenarioWalker({ req, res, session })

    await storage.save({ id: sessionId, session })

    return res.message
}