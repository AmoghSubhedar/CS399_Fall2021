#pragma once
#include "Windows/MinWindows.h"
#include <unordered_map>
#include <set>

struct FunctionData
{
  std::string name{};
  std::string moduleName{};
  std::unordered_map<double, int> hitcount{};
};

class Profiler
{
public:
  Profiler();
  ~Profiler();
  void * mainthread;
  void * timer = NULL;
  void * timerqueue = NULL;
  void * done = NULL;
  int samplecount = 0;
  const int maxsamples = 10000;
  std::vector<std::unordered_map<unsigned long long , int>> data;
  std::set<unsigned long long> allFunctions;
  std::unordered_map<unsigned long long, FunctionData> functiondata;
  std::string baseName;
};