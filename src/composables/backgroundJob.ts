import { BackgroundTaskStatus } from '@/types';
import { AxiosInstance } from 'axios';

const jobs = ref<Record<string, { jobType: string; taskStatus?: BackgroundTaskStatus }>>({});

export function useBackgroundJob() {
  function startBgJob(api: AxiosInstance, showAlert: any, jobId: string, jobType: string) {
    async function getBackgroundJobStatus(jobId: string) {
      try {
        const { data } = await api.get<BackgroundTaskStatus>(`/background/${jobId}`);
        return Promise.resolve(data);
      } catch (error) {
        console.error(error);
        return Promise.reject(error);
      }
    }

    const evaluating = ref(false);
    const result = ref<BackgroundTaskStatus | null>(null);
    jobs.value[jobId] = { jobType };

    const interval = window.setInterval(async () => {
      try {
        result.value = await getBackgroundJobStatus(jobId);
        if (!result.value.running) {
          clearJobFromList();
        }
        jobs.value[jobId] = { ...jobs.value[jobId], taskStatus: result.value };
      } catch (error) {
        console.error(error);
        showAlert('Failed to get background job status', 'error');
        clearJobFromList();
      }
    }, 500);

    function clearJobFromList() {
      if (interval) {
        clearInterval(interval);
      }
      evaluating.value = false;
    }

    return {
      evaluating,
      result,
    };
  }

  const runningJobs = computed(() => jobs.value);
  function clearJobs() {
    // Clear all jobs that are not running
    for (const [jobId, job] of Object.entries(jobs.value)) {
      if (job.taskStatus?.status !== 'running') {
        delete jobs.value[jobId];
      }
    }
  }

  return {
    runningJobs,
    startBgJob,
    clearJobs,
  };
}
