class AzureDevOpsClient {
  constructor(orgUrl, pat) {
    this.orgUrl = orgUrl;
    this.pat = pat;
    
    // Mock data storage
    this.mockData = {
      workItems: this.generateMockWorkItems(),
      pullRequests: this.generateMockPRs(),
      builds: this.generateMockBuilds(),
      testResults: this.generateMockTestResults(),
      iterations: this.generateMockIterations(),
      releases: this.generateMockReleases()
    };
  }
  
  async getWorkItems(params) {
    const { project, ids, wiql, type } = params;
    
    let items = this.mockData.workItems.filter(wi => wi.project === project);
    
    if (ids && ids.length > 0) {
      items = items.filter(wi => ids.includes(wi.id));
    }
    
    if (type) {
      items = items.filter(wi => wi.type === type);
    }
    
    if (wiql) {
      // Simple WIQL parsing for demo
      if (wiql.includes('State = \'Active\'')) {
        items = items.filter(wi => wi.state === 'Active');
      }
    }
    
    return {
      count: items.length,
      workItems: items
    };
  }
  
  async createWorkItem(params) {
    const { project, type, title, description, priority, assignedTo } = params;
    
    const newItem = {
      id: Math.floor(Math.random() * 10000) + 1000,
      project,
      type,
      title,
      description: description || '',
      state: 'New',
      priority: priority || 2,
      assignedTo: assignedTo || 'Unassigned',
      createdDate: new Date().toISOString(),
      url: `${this.orgUrl}/${project}/_workitems/edit/${Math.floor(Math.random() * 10000)}`
    };
    
    this.mockData.workItems.push(newItem);
    
    return {
      success: true,
      workItem: newItem
    };
  }
  
  async getPullRequests(params) {
    const { project, repository, status, reviewerId } = params;
    
    let prs = this.mockData.pullRequests.filter(pr => 
      pr.project === project && pr.repository === repository
    );
    
    if (status && status !== 'all') {
      prs = prs.filter(pr => pr.status === status);
    }
    
    if (reviewerId) {
      prs = prs.filter(pr => pr.reviewers.some(r => r.id === reviewerId));
    }
    
    return {
      count: prs.length,
      pullRequests: prs
    };
  }
  
  async getBuilds(params) {
    const { project, buildId, definitionName, top = 10 } = params;
    
    let builds = this.mockData.builds.filter(b => b.project === project);
    
    if (buildId) {
      builds = builds.filter(b => b.id === buildId);
    }
    
    if (definitionName) {
      builds = builds.filter(b => b.definition === definitionName);
    }
    
    return {
      count: builds.length,
      builds: builds.slice(0, top)
    };
  }
  
  async getTestResults(params) {
    const { project, buildId, outcome } = params;
    
    let results = this.mockData.testResults.filter(t => t.project === project);
    
    if (buildId) {
      results = results.filter(t => t.buildId === buildId);
    }
    
    if (outcome && outcome !== 'All') {
      results = results.filter(t => t.outcome === outcome);
    }
    
    const summary = {
      total: results.length,
      passed: results.filter(t => t.outcome === 'Passed').length,
      failed: results.filter(t => t.outcome === 'Failed').length,
      notExecuted: results.filter(t => t.outcome === 'NotExecuted').length
    };
    
    return {
      summary,
      tests: results
    };
  }
  
  async getTeamIteration(params) {
    const { project, team, timeframe = 'current' } = params;
    
    const iterations = this.mockData.iterations.filter(i => 
      i.project === project && i.team === team
    );
    
    if (timeframe === 'current') {
      const now = new Date();
      return iterations.find(i => {
        const start = new Date(i.startDate);
        const end = new Date(i.endDate);
        return start <= now && now <= end;
      }) || iterations[0];
    }
    
    return iterations[0];
  }
  
  async getReleases(params) {
    const { project, releaseId, environment } = params;
    
    let releases = this.mockData.releases.filter(r => r.project === project);
    
    if (releaseId) {
      releases = releases.filter(r => r.id === releaseId);
    }
    
    if (environment) {
      releases = releases.map(r => ({
        ...r,
        environments: r.environments.filter(e => e.name === environment)
      }));
    }
    
    return {
      count: releases.length,
      releases
    };
  }
  
  // Mock data generators
  generateMockWorkItems() {
    return [
      {
        id: 1234,
        project: 'ProjectAlpha',
        type: 'User Story',
        title: 'Implement user authentication',
        description: 'Add OAuth 2.0 authentication flow',
        state: 'Active',
        priority: 1,
        assignedTo: 'john@contoso.com',
        iterationPath: 'Sprint 23',
        createdDate: '2025-10-15T10:00:00Z'
      },
      {
        id: 1235,
        project: 'ProjectAlpha',
        type: 'Bug',
        title: 'Login page crashes on mobile',
        description: 'App crashes when clicking login button on iOS',
        state: 'Active',
        priority: 1,
        assignedTo: 'sarah@contoso.com',
        iterationPath: 'Sprint 23',
        createdDate: '2025-10-20T14:30:00Z'
      },
      {
        id: 1236,
        project: 'ProjectAlpha',
        type: 'Task',
        title: 'Update API documentation',
        description: 'Document new authentication endpoints',
        state: 'Completed',
        priority: 2,
        assignedTo: 'mike@contoso.com',
        iterationPath: 'Sprint 23',
        createdDate: '2025-10-18T09:00:00Z'
      }
    ];
  }
  
  generateMockPRs() {
    return [
      {
        id: 456,
        project: 'ProjectAlpha',
        repository: 'main-repo',
        title: 'Feature: Add OAuth authentication',
        status: 'active',
        createdBy: 'john@contoso.com',
        createdDate: '2025-10-25T10:00:00Z',
        reviewers: [
          { id: 'sarah@contoso.com', name: 'Sarah Johnson', vote: 0 }
        ],
        url: 'https://dev.azure.com/contoso/ProjectAlpha/_git/main-repo/pullrequest/456'
      },
      {
        id: 457,
        project: 'ProjectAlpha',
        repository: 'main-repo',
        title: 'Fix: Mobile login crash',
        status: 'active',
        createdBy: 'sarah@contoso.com',
        createdDate: '2025-10-26T14:00:00Z',
        reviewers: [
          { id: 'john@contoso.com', name: 'John Smith', vote: 10 }
        ],
        url: 'https://dev.azure.com/contoso/ProjectAlpha/_git/main-repo/pullrequest/457'
      }
    ];
  }
  
  generateMockBuilds() {
    return [
      {
        id: 8901,
        project: 'ProjectAlpha',
        definition: 'MainPipeline',
        buildNumber: '20251029.1',
        status: 'completed',
        result: 'succeeded',
        queueTime: '2025-10-29T08:00:00Z',
        startTime: '2025-10-29T08:01:00Z',
        finishTime: '2025-10-29T08:15:00Z',
        url: 'https://dev.azure.com/contoso/ProjectAlpha/_build/results?buildId=8901'
      },
      {
        id: 8902,
        project: 'ProjectAlpha',
        definition: 'MainPipeline',
        buildNumber: '20251029.2',
        status: 'completed',
        result: 'partiallySucceeded',
        queueTime: '2025-10-29T10:00:00Z',
        startTime: '2025-10-29T10:01:00Z',
        finishTime: '2025-10-29T10:18:00Z',
        url: 'https://dev.azure.com/contoso/ProjectAlpha/_build/results?buildId=8902'
      }
    ];
  }
  
  generateMockTestResults() {
    return [
      {
        id: 1,
        project: 'ProjectAlpha',
        buildId: 8902,
        testCase: 'LoginTest',
        outcome: 'Passed',
        duration: 1.2,
        errorMessage: null
      },
      {
        id: 2,
        project: 'ProjectAlpha',
        buildId: 8902,
        testCase: 'AuthenticationTest',
        outcome: 'Passed',
        duration: 2.5,
        errorMessage: null
      },
      {
        id: 3,
        project: 'ProjectAlpha',
        buildId: 8902,
        testCase: 'PaymentTest',
        outcome: 'Failed',
        duration: 0.8,
        errorMessage: 'Connection timeout after 30 seconds'
      }
    ];
  }
  
  generateMockIterations() {
    return [
      {
        id: 'sprint-23',
        project: 'ProjectAlpha',
        team: 'Team A',
        name: 'Sprint 23',
        startDate: '2025-10-21T00:00:00Z',
        endDate: '2025-11-03T23:59:59Z',
        path: 'ProjectAlpha\\Sprint 23'
      }
    ];
  }
  
  generateMockReleases() {
    return [
      {
        id: 123,
        project: 'ProjectAlpha',
        name: 'Release-2.4.1',
        status: 'active',
        createdOn: '2025-10-29T06:00:00Z',
        environments: [
          {
            name: 'Development',
            status: 'succeeded',
            deployedOn: '2025-10-29T06:15:00Z'
          },
          {
            name: 'Production',
            status: 'succeeded',
            deployedOn: '2025-10-29T08:00:00Z'
          }
        ]
      }
    ];
  }
}