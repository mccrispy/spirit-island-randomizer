# Updating a feature branch while preserving uncommitted work

Use this only when a pull request needs recent `main` changes, you have
uncommitted work on the feature branch, and you are not ready to make a local
commit. The normal and simpler approach is to commit a checkpoint, then follow
**Push and merge the pull request** in
[Development and release workflow](./RELEASING.md).

This procedure merges `origin/main` into your feature branch. It does not
switch to or update local `main`, and it does not discard your changes.

The commands below are for PowerShell. Run them in a terminal opened inside
the repository.

## 1. Confirm the branch and inspect your work

```powershell
git status --short --branch
git diff --cached
git diff
```

Confirm that you are on the intended feature or maintenance branch, not `main`.
Review the staged and unstaged changes. Resolve any existing conflicts before
continuing. If you are on `main`, use the normal workflow to create a feature
branch before proceeding; creating a branch with `git switch -c` preserves
staged, unstaged, and untracked changes.

## 2. Stash the uncommitted work

Save staged, unstaged, and untracked changes:

```powershell
git stash push --include-untracked -m "WIP before updating feature branch"
git status --short --branch
git stash list
```

Confirm the working tree is clean. In the stash list, note the reference for
`WIP before updating feature branch` (for example, `stash@{0}`). Use that exact
reference below; do not assume it is still the newest stash later.

## 3. Merge the latest `main` into the feature branch

Fetch remote updates and merge `origin/main` into the current feature branch:

```powershell
git fetch origin
git merge origin/main
```

If Git reports conflicts, resolve them before continuing. After resolving,
stage the resolved files and complete the merge commit as Git instructs. Do
not use reset or force-push to get past conflicts.

## 4. Restore the uncommitted work

Apply the exact stash reference you noted, replacing the example as needed:

```powershell
git stash apply --index 'stash@{0}'
```

`--index` attempts to restore which changes were staged. If Git says the index
patch cannot be applied, check `git status --short --branch`. If the worktree
is clean and there are no conflicts, retry without `--index`:

```powershell
git stash apply 'stash@{0}'
```

If conflicts occur, resolve them without dropping the stash. Review the
resulting changes with `git status --short --branch`, `git diff --cached`, and
`git diff`. Stage only the intended changes.

## 5. Verify, then remove the backup

Run the relevant checks and inspect the final worktree. Keep the stash until
you have confirmed the changes are restored and correct. Then, if you want to
remove that backup, drop the exact reference you applied:

```powershell
git stash drop 'stash@{0}'
```

If anything is missing or uncertain, do not drop the stash. After verification,
continue with the normal workflow in
[Development and release workflow](./RELEASING.md).
