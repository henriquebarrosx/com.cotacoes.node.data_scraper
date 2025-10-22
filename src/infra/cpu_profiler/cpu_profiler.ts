import { writeFile } from 'node:fs/promises';
import { Session } from 'node:inspector/promises';

import { type Logger } from '../logger/logger.ts';

export function createCpuProfiler({ providers }: CpuProfilerArgs) {
    const { logger } = providers;

    let _session: Session;

    async function start() {
        _session = new Session();
        _session.connect();

        await _session.post('Profiler.enable');
        await _session.post('Profiler.start');

        logger.info('Started Cpu Profiler');

        const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT']

        signals.forEach((signal) =>
            process.once(signal, async () => {
                await stop();
                process.exit(0);
            })
        )
    }

    async function stop() {
        logger.info('Stopping Cpu Profiler')

        const { profile } = await _session.post('Profiler.stop');
        const profileName = `cpu-profile-${Date.now()}.cpuprofile`;
        await writeFile(profileName, JSON.stringify(profile));

        _session.disconnect();
    }

    return {
        start,
    }
}

type CpuProfilerArgs = {
    providers: {
        logger: Logger;
    }
}